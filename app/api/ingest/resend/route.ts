/* ==========================================================
   OUTFLO — RESEND INGEST WEBHOOK
   File: app/api/ingest/resend/route.ts
   Scope: Receive Resend webhook events and persist to ingest_events (idempotent)
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
    // Resend payload commonly includes:
    email_id?: string; // actual email id (uuid-ish)
    from?: string;
    to?: string[];
    subject?: string;
    // plus many other fields we store in raw
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

/* ------------------------------
   Helpers
-------------------------------- */
function envOrNull(key: string): string | null {
  const v = process.env[key];
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : null;
}

function safeJsonParse<T>(raw: string): { ok: true; value: T } | { ok: false; error: string } {
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
  // Prefer provider timestamp if present, otherwise now.
  // Resend tends to provide created_at at top-level.
  if (payload?.created_at && typeof payload.created_at === "string") return payload.created_at;
  return isoNow();
}

function extractEventId(payload: ResendWebhookPayload): string | null {
  // We want a stable idempotency key for the webhook delivery.
  // Prefer payload.id. Fall back to a few known places.
  const candidates = [
    payload?.id,
    (payload as any)?.data?.id,
    payload?.data?.email_id, // last-resort fallback (still better than null)
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length) return c.trim();
  }
  return null;
}

function extractMessageId(payload: ResendWebhookPayload): string | null {
  // This identifies the actual email entity (not the webhook event).
  const v = payload?.data?.email_id;
  if (typeof v === "string" && v.trim().length) return v.trim();
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
    client: createClient(url, key, {
      auth: { persistSession: false },
    }),
  };
}

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  // 1) Env + client
  const svc = supabaseService();
  if (!svc.ok) {
    return NextResponse.json({ ok: false, where: svc.where, message: svc.message }, { status: 500 });
  }
  const supabase = svc.client;

  // 2) Read body (raw text first, then JSON)
  const rawText = await req.text();
  const parsed = safeJsonParse<ResendWebhookPayload>(rawText);

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, where: "payload", message: `Invalid JSON: ${parsed.error}` },
      { status: 400 }
    );
  }

  const payload = parsed.value;

  // 3) Extract ids
  const event_id = extractEventId(payload);
  const message_id = extractMessageId(payload);
  const received_at = pickReceivedAt(payload);

  if (!event_id) {
    return NextResponse.json(
      { ok: false, where: "payload", message: "Missing event_id (payload.id)" },
      { status: 400 }
    );
  }

  // 4) Insert (idempotent on event_id)
  const { data, error } = await supabase
    .from("ingest_events")
    .insert({
      provider: PROVIDER,
      event_id,
      message_id, // nullable
      received_at,
      raw: payload, // jsonb
      user_id: null, // resolved later via alias
    })
    .select("id")
    .single();

  if (error) {
    const e = error as unknown as DbErrorLike;

    // Unique violation on event_id => safe retry / dedupe
    if (e.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true, event_id }, { status: 200 });
    }

    // Any other DB failure => 500
    return NextResponse.json(
      { ok: false, where: "db", message: e.message || "DB insert failed", code: e.code || null },
      { status: 500 }
    );
  }

  // 5) Success
  return NextResponse.json({ ok: true, inserted_id: data.id, event_id }, { status: 200 });
}