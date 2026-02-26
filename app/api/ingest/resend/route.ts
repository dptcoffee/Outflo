/* ==========================================================
   OUTFLO — RESEND INGEST WEBHOOK (BIND USER)
   File: app/api/ingest/resend/route.ts
   Scope: Receive Resend webhook events, resolve user via ingest_aliases, and persist to ingest_events (idempotent)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------
   Types
-------------------------------- */
type ResendWebhookPayload = {
  id?: string; // webhook event id (often msg_...)
  type?: string; // e.g., "email.received"
  created_at?: string; // ISO string
  data?: {
    email_id?: string; // Resend email id (uuid-ish)
    from?: string;
    to?: string[]; // typically contains the alias address
    subject?: string;
    [key: string]: any;
  };
  [key: string]: any;
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
const VERSION = "ingest-resend-v2-bind-user";

/* ------------------------------
   Helpers
-------------------------------- */
function envOrNull(key: string): string | null {
  const v = process.env[key];
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

function safeJsonParse<T>(
  raw: string
): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || "invalid json" };
  }
}

function isoNow(): string {
  return new Date().toISOString();
}

function pickReceivedAt(payload: ResendWebhookPayload): string {
  if (payload?.created_at && typeof payload.created_at === "string") return payload.created_at;
  return isoNow();
}

function extractEventId(payload: ResendWebhookPayload): string | null {
  // Idempotency key: prefer webhook event id, else email_id
  const candidates = [payload?.id, payload?.data?.email_id];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length) return c.trim();
  }
  return null;
}

function extractEmailId(payload: ResendWebhookPayload): string | null {
  const v = payload?.data?.email_id;
  if (typeof v === "string" && v.trim().length) return v.trim();
  return null;
}

function extractAliasLocalPart(payload: ResendWebhookPayload): string | null {
  // We bind user based on the recipient alias address:
  // to: ["2174441244514@outflo.xyz"]
  const to = payload?.data?.to;
  if (!Array.isArray(to) || !to.length) return null;

  for (const addr of to) {
    if (typeof addr !== "string") continue;
    const trimmed = addr.trim();
    const at = trimmed.indexOf("@");
    if (at <= 0) continue;
    const local = trimmed.slice(0, at).trim();
    if (local.length) return local;
  }
  return null;
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

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  // 1) Env + client
  const svc = supabaseService();
  if (!svc.ok) {
    return NextResponse.json(
      { ok: false, where: svc.where, message: svc.message, version: VERSION },
      { status: 500 }
    );
  }
  const supabase = svc.client;

  // 2) Read body (raw text first, then JSON)
  const rawText = await req.text();
  const parsed = safeJsonParse<ResendWebhookPayload>(rawText);

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, where: "payload", message: `Invalid JSON: ${parsed.error}`, version: VERSION },
      { status: 400 }
    );
  }

  const payload = parsed.value;

  // 3) Extract ids + alias local_part
  const event_id = extractEventId(payload);
  const email_id = extractEmailId(payload); // stored in message_id column (current schema)
  const local_part = extractAliasLocalPart(payload);
  const received_at = pickReceivedAt(payload);

  if (!event_id) {
    return NextResponse.json(
      { ok: false, where: "payload", message: "Missing event_id (payload.id or data.email_id)", version: VERSION },
      { status: 400 }
    );
  }

  if (!local_part) {
    return NextResponse.json(
      { ok: false, where: "payload", message: "Missing recipient alias (data.to)", version: VERSION },
      { status: 400 }
    );
  }

  // 4) Resolve user_id from ingest_aliases (canonical + active)
  const { data: aliasRow, error: aliasErr } = await supabase
    .from("ingest_aliases")
    .select("user_id")
    .eq("local_part", local_part)
    .eq("is_active", true)
    .maybeSingle();

  if (aliasErr) {
    const e = aliasErr as unknown as DbErrorLike;
    return NextResponse.json(
      { ok: false, where: "db", message: e.message || "Alias lookup failed", code: e.code || null, version: VERSION },
      { status: 500 }
    );
  }

  const user_id = aliasRow?.user_id as string | null;

  if (!user_id) {
    // Not a DB failure — unknown alias. Do not write an ingest_event.
    return NextResponse.json(
      { ok: false, where: "alias", message: `No active alias for local_part=${local_part}`, version: VERSION },
      { status: 404 }
    );
  }

  // 5) Insert event (idempotent on event_id)
  const { data: inserted, error: insErr } = await supabase
    .from("ingest_events")
    .insert({
      provider: PROVIDER,
      event_id,
      message_id: email_id, // current schema: this is Resend email_id
      received_at,
      raw: payload, // jsonb
      user_id, // ✅ bound
    })
    .select("id")
    .single();

  if (insErr) {
    const e = insErr as unknown as DbErrorLike;

    // Unique violation on event_id => safe retry / dedupe
    if (e.code === "23505") {
      return NextResponse.json(
        { ok: true, deduped: true, event_id, local_part, user_id, version: VERSION },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: false, where: "db", message: e.message || "DB insert failed", code: e.code || null, version: VERSION },
      { status: 500 }
    );
  }

  // 6) Success (includes proof fields)
  return NextResponse.json(
    { ok: true, inserted_id: inserted.id, event_id, local_part, user_id, version: VERSION },
    { status: 200 }
  );
}