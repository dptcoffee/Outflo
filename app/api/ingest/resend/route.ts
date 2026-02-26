/* ==========================================================
   OUTFLO — RESEND INGEST WEBHOOK
   File: app/api/ingest/resend/route.ts
   Scope: Receive Resend webhook events and persist to ingest_events (idempotent + user-bound via ingest_aliases)
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
  id?: string; // resend event id (msg_...)
  type?: string; // e.g. "email.received"
  created_at?: string; // ISO string
  data?: {
    email_id?: string; // resend email uuid (stable)
    message_id?: string; // RFC message-id, e.g. "<CAB...@mail...>"
    from?: string;
    to?: string[];
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
  if (payload?.data?.created_at && typeof (payload as any).data.created_at === "string")
    return (payload as any).data.created_at;
  return isoNow();
}

function extractEventId(payload: ResendWebhookPayload): string | null {
  // Prefer stable resend email uuid for idempotency; fallback to webhook id.
  const candidates = [payload?.data?.email_id, payload?.id];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length) return c.trim();
  }
  return null;
}

function extractMessageId(payload: ResendWebhookPayload): string | null {
  // Store RFC message-id if present (different from email_id).
  const v = payload?.data?.message_id;
  if (typeof v === "string" && v.trim().length) return v.trim();
  return null;
}

function extractToAddress(payload: ResendWebhookPayload): string | null {
  const to = payload?.data?.to;
  if (Array.isArray(to) && typeof to[0] === "string" && to[0].trim().length) {
    return to[0].trim().toLowerCase();
  }
  return null;
}

function localPartFromEmail(addr: string): string | null {
  const at = addr.indexOf("@");
  if (at <= 0) return null;
  const local = addr.slice(0, at).trim().toLowerCase();
  return local.length ? local : null;
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

  // 2) Read body
  const rawText = await req.text();
  const parsed = safeJsonParse<ResendWebhookPayload>(rawText);

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, where: "payload", message: `Invalid JSON: ${parsed.error}` },
      { status: 400 }
    );
  }

  const payload = parsed.value;

  // 3) Extract ids + recipient local_part
  const event_id = extractEventId(payload);
  const message_id = extractMessageId(payload);
  const received_at = pickReceivedAt(payload);

  if (!event_id) {
    return NextResponse.json(
      { ok: false, where: "payload", message: "Missing event_id (expected data.email_id or payload.id)" },
      { status: 400 }
    );
  }

  const toAddr = extractToAddress(payload);
  if (!toAddr) {
    return NextResponse.json(
      { ok: false, where: "payload", message: "Missing recipient (expected data.to[0])" },
      { status: 400 }
    );
  }

  const local_part = localPartFromEmail(toAddr);
  if (!local_part) {
    return NextResponse.json(
      { ok: false, where: "payload", message: `Invalid recipient address: ${toAddr}` },
      { status: 400 }
    );
  }

  // 4) Resolve user_id from ingest_aliases (canonical binding)
  const { data: aliasRow, error: aliasErr } = await supabase
    .from("ingest_aliases")
    .select("user_id")
    .eq("local_part", local_part)
    .eq("is_active", true)
    .single();

  if (aliasErr) {
    const e = aliasErr as unknown as DbErrorLike;
    return NextResponse.json(
      {
        ok: false,
        where: "db",
        message: e.message || "Alias lookup failed",
        code: e.code || null,
      },
      { status: 500 }
    );
  }

  const user_id = aliasRow?.user_id as string | null;
  if (!user_id) {
    return NextResponse.json(
      { ok: false, where: "alias", message: `No active alias found for local_part: ${local_part}` },
      { status: 400 }
    );
  }

  // 5) Insert ingest event (idempotent on event_id)
  const { data: ins, error: insErr } = await supabase
    .from("ingest_events")
    .insert({
      provider: PROVIDER,
      event_id,
      message_id, // nullable
      received_at,
      raw: payload, // jsonb
      user_id, // resolved now
    })
    .select("id")
    .single();

  if (insErr) {
    const e = insErr as unknown as DbErrorLike;

    // Unique violation => dedupe ok
    if (e.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true, event_id }, { status: 200 });
    }

    return NextResponse.json(
      { ok: false, where: "db", message: e.message || "DB insert failed", code: e.code || null },
      { status: 500 }
    );
  }

  // 6) Success
  return NextResponse.json(
    { ok: true, inserted_id: ins.id, event_id, local_part, user_id },
    { status: 200 }
  );
}