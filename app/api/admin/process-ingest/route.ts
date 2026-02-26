/* ==========================================================
   OUTFLO — ADMIN INGEST PROCESSOR
   File: app/api/admin/process-ingest/route.ts
   Scope: Convert bound ingest_events into receipts for a single user (idempotent)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------
   Types
-------------------------------- */
type ProcessRequestBody = {
  user_id: string; // required (Scope C)
  limit?: number; // optional
};

type IngestEventRow = {
  id: string; // uuid
  user_id: string; // uuid (bound)
  provider: string;
  event_id: string | null;
  message_id: string | null;
  received_at: string; // timestamptz
  raw: any; // jsonb
};

type DbErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/* ------------------------------
   Constants
-------------------------------- */
export const runtime = "nodejs";

const PROVIDER = "resend";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 250;

/* ------------------------------
   Helpers
-------------------------------- */
function envOrNull(key: string): string | null {
  const v = process.env[key];
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

function uuidLike(v: string): boolean {
  // Good-enough UUID v4-ish check for admin input validation
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function clampLimit(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  const rounded = Math.floor(n);
  if (rounded < 1) return 1;
  if (rounded > MAX_LIMIT) return MAX_LIMIT;
  return rounded;
}

function safeJson<T>(raw: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || "invalid json" };
  }
}

function toEpochMs(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Date.now();
  return t;
}

function pickPlace(ev: IngestEventRow): string {
  // For now: Subject is the cleanest deterministic “place” proxy.
  const subject = ev?.raw?.data?.subject;
  if (typeof subject === "string" && subject.trim().length) return subject.trim();

  // Fallbacks (still deterministic)
  const from = ev?.raw?.data?.from;
  if (typeof from === "string" && from.trim().length) return from.trim();

  return "Unknown";
}

function supabaseService() {
  const url = envOrNull("SUPABASE_URL") || envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrNull("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) return { ok: false as const, where: "env" as const, message: "Missing SUPABASE_URL" };
  if (!key)
    return { ok: false as const, where: "env" as const, message: "Missing SUPABASE_SERVICE_ROLE_KEY" };

  return {
    ok: true as const,
    client: createClient(url, key, { auth: { persistSession: false } }),
  };
}

function requireVaultKey(req: Request): { ok: true } | { ok: false; status: number; message: string } {
  const expected = envOrNull("OUTFLO_VAULT_KEY");
  if (!expected) {
    return { ok: false, status: 500, message: "Missing OUTFLO_VAULT_KEY" };
  }

  const got =
    req.headers.get("x-outflo-vault-key") ||
    req.headers.get("x-outflo-vault") ||
    req.headers.get("authorization");

  if (!got) return { ok: false, status: 401, message: "Missing vault key" };

  // Allow either raw key or "Bearer <key>"
  const normalized = got.startsWith("Bearer ") ? got.slice("Bearer ".length).trim() : got.trim();
  if (normalized !== expected) return { ok: false, status: 403, message: "Invalid vault key" };

  return { ok: true };
}

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  // 0) Auth
  const auth = requireVaultKey(req);
  if (!auth.ok) return NextResponse.json({ ok: false, where: "auth", message: auth.message }, { status: auth.status });

  // 1) Supabase
  const svc = supabaseService();
  if (!svc.ok) {
    return NextResponse.json({ ok: false, where: svc.where, message: svc.message }, { status: 500 });
  }
  const supabase = svc.client;

  // 2) Parse body
  const rawText = await req.text();
  const parsed = safeJson<ProcessRequestBody>(rawText || "{}");
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, where: "payload", message: `Invalid JSON: ${parsed.error}` },
      { status: 400 }
    );
  }

  const body = parsed.value;
  const user_id = (body?.user_id || "").trim();
  const limit = clampLimit(body?.limit);

  if (!user_id || !uuidLike(user_id)) {
    return NextResponse.json(
      { ok: false, where: "payload", message: "user_id is required and must be a UUID" },
      { status: 400 }
    );
  }

  // 3) Load ingest_events (already bound to user_id by ingest v2)
  // NOTE: We intentionally do NOT rely on processed_at/receipt_id columns.
  // Idempotency is achieved by using ingest_events.id as receipts.id (PK).
  const { data: events, error: evErr } = await supabase
    .from("ingest_events")
    .select("id,user_id,provider,event_id,message_id,received_at,raw")
    .eq("provider", PROVIDER)
    .eq("user_id", user_id)
    .order("received_at", { ascending: true })
    .limit(limit);

  if (evErr) {
    const e = evErr as unknown as DbErrorLike;
    return NextResponse.json(
      { ok: false, where: "db", message: e.message || "Failed to read ingest_events", code: e.code || null },
      { status: 500 }
    );
  }

  const rows = (events || []) as IngestEventRow[];
  if (!rows.length) {
    return NextResponse.json(
      { ok: true, processed: 0, deduped: 0, message: "No ingest_events found for user/provider" },
      { status: 200 }
    );
  }

  // 4) Convert -> receipts (Amount Strategy A: always 0 for now)
  // Idempotent rule:
  // - receipts.id := ingest_events.id (uuid)
  // - upsert onConflict: "id" with ignoreDuplicates
  let processed = 0;
  let deduped = 0;

  for (const ev of rows) {
    const ts = toEpochMs(ev.received_at);
    const place = pickPlace(ev);

    const receipt = {
      id: ev.id,
      user_id: ev.user_id,
      ts,
      place,
      amount: 0,
      raw: {
        source: "ingest",
        provider: ev.provider,
        event_id: ev.event_id,
        message_id: ev.message_id,
        received_at: ev.received_at,
        payload: ev.raw,
      },
    };

    const { error: insErr } = await supabase
      .from("receipts")
      .upsert(receipt, { onConflict: "id", ignoreDuplicates: true });

    if (insErr) {
      const e = insErr as unknown as DbErrorLike;
      return NextResponse.json(
        {
          ok: false,
          where: "db",
          message: e.message || "Failed to write receipts",
          code: e.code || null,
          event_id: ev.event_id,
          ingest_event_id: ev.id,
        },
        { status: 500 }
      );
    }

    // We can’t perfectly know whether this particular row inserted or was deduped
    // without a select/returning on every upsert.
    // So we do a cheap heuristic: treat all as "processed" for this run,
    // and expose that dedupe is guaranteed by primary key conflict behavior.
    processed += 1;
  }

  return NextResponse.json(
    {
      ok: true,
      processed,
      deduped,
      user_id,
      provider: PROVIDER,
      limit,
      version: "process-ingest-v1-receipts-idempotent",
      note: "Idempotent via receipts.id = ingest_events.id (PK conflict => no duplicate receipts).",
    },
    { status: 200 }
  );
}