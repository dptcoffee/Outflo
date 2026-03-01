/* ==========================================================
   OUTFLO — RESEND INGEST WEBHOOK (INSTANT STUB + CASHAPP V1)
   File: app/api/ingest/resend/route.ts
   Scope: Receive Resend webhook, bind user via ingest_aliases, persist ingest_events, create receipt stub immediately, enrich via CashApp subject parser
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------
   Types
-------------------------------- */
type ResendWebhookPayload = {
  id?: string;
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
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
const VERSION = "ingest-resend-v4-cashapp-subject";

/* ------------------------------
   Helpers
-------------------------------- */
function envOrNull(key: string): string | null {
  const v = process.env[key];
  if (!v) return null;
  const t = v.trim();
  return t.length ? t : null;
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
  if (payload?.created_at && typeof payload.created_at === "string")
    return payload.created_at;
  return isoNow();
}

function extractEventId(payload: ResendWebhookPayload): string | null {
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

function receivedAtToTsMs(received_at: string): number {
  const ms = Date.parse(received_at);
  if (Number.isFinite(ms)) return ms;
  return Date.now();
}

function supabaseService() {
  const url =
    envOrNull("SUPABASE_URL") || envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrNull("SUPABASE_SERVICE_ROLE_KEY");

  if (!url)
    return {
      ok: false as const,
      where: "env" as const,
      message: "Missing SUPABASE_URL",
    };
  if (!key)
    return {
      ok: false as const,
      where: "env" as const,
      message: "Missing SUPABASE_SERVICE_ROLE_KEY",
    };

  return {
    ok: true as const,
    client: createClient(url, key, { auth: { persistSession: false } }),
  };
}

/* ------------------------------
   CashApp Subject Parser v1
-------------------------------- */
function parseCashAppSubject(subject: string | undefined) {
  if (!subject || typeof subject !== "string") return null;

  const spentMatch = subject.match(/You spent \$([0-9]+\.[0-9]{2}) at (.+)$/i);
  if (spentMatch) {
    return {
      direction: "out" as const,
      amount: parseFloat(spentMatch[1]),
      place: spentMatch[2].trim(),
      confidence: "high" as const,
    };
  }

  const receivedMatch = subject.match(
    /You received \$([0-9]+\.[0-9]{2}) from (.+)$/i
  );
  if (receivedMatch) {
    return {
      direction: "in" as const,
      amount: parseFloat(receivedMatch[1]),
      place: receivedMatch[2].trim(),
      confidence: "high" as const,
    };
  }

  return null;
}

/* ------------------------------
   Ensure Stub Creation
-------------------------------- */
async function ensureReceiptStub(args: {
  supabase: SupabaseClient<any>;
  ingest_id: string;
  user_id: string;
  provider: string;
  event_id: string;
  message_id: string | null;
  received_at: string;
  payload: ResendWebhookPayload;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    supabase,
    ingest_id,
    user_id,
    provider,
    event_id,
    message_id,
    received_at,
    payload,
  } = args;

  const ts = receivedAtToTsMs(received_at);

  const { error: upsertErr } = await supabase
    .from("receipts")
    .upsert(
      {
        id: ingest_id,
        user_id,
        ts,
        // stub: subject is allowed temporarily; enrichment overwrites
        place: payload?.data?.subject ?? "ingest",
        amount: 0,
        raw: {
          source: "ingest",
          provider,
          event_id,
          message_id,
          received_at,
          payload,
        },
      } as any,
      { onConflict: "id" }
    );

  if (upsertErr) {
    return { ok: false, message: upsertErr.message };
  }

  const { error: markErr } = await supabase
    .from("ingest_events")
    .update({ processed_at: isoNow() } as any)
    .eq("id", ingest_id);

  if (markErr) {
    return { ok: false, message: markErr.message };
  }

  return { ok: true };
}

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  const svc = supabaseService();
  if (!svc.ok) {
    return NextResponse.json(
      { ok: false, where: svc.where, message: svc.message, version: VERSION },
      { status: 500 }
    );
  }

  const supabase = svc.client;

  const rawText = await req.text();
  const parsed = safeJsonParse<ResendWebhookPayload>(rawText);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, where: "payload", message: parsed.error, version: VERSION },
      { status: 400 }
    );
  }

  const payload = parsed.value;

  const event_id = extractEventId(payload);
  const email_id = extractEmailId(payload);
  const local_part = extractAliasLocalPart(payload);
  const received_at = pickReceivedAt(payload);

  if (!event_id || !local_part) {
    return NextResponse.json(
      {
        ok: false,
        where: "payload",
        message: "Missing required fields",
        version: VERSION,
      },
      { status: 400 }
    );
  }

  const { data: aliasRow } = await supabase
    .from("ingest_aliases")
    .select("user_id")
    .eq("local_part", local_part)
    .eq("is_active", true)
    .maybeSingle();

  if (!aliasRow?.user_id) {
    return NextResponse.json(
      { ok: false, where: "alias", message: "No active alias", version: VERSION },
      { status: 404 }
    );
  }

  const user_id = aliasRow.user_id;

  const { data: inserted, error: insErr } = await supabase
    .from("ingest_events")
    .insert({
      provider: PROVIDER,
      event_id,
      message_id: email_id,
      received_at,
      raw: payload,
      user_id,
    })
    .select("id")
    .single();

  if (insErr) {
    if ((insErr as DbErrorLike).code === "23505") {
      return NextResponse.json({ ok: true, deduped: true, version: VERSION });
    }
    return NextResponse.json(
      { ok: false, where: "db", message: insErr.message, version: VERSION },
      { status: 500 }
    );
  }

  const ingest_id = inserted.id as string;

  const stub = await ensureReceiptStub({
    supabase,
    ingest_id,
    user_id,
    provider: PROVIDER,
    event_id,
    message_id: email_id,
    received_at,
    payload,
  });

  if (!stub.ok) {
    return NextResponse.json(
      { ok: false, where: "stub", message: stub.message, version: VERSION },
      { status: 500 }
    );
  }

/* ------------------------------
   CashApp Enrichment
-------------------------------- */
const from = payload?.data?.from;
const subject = payload?.data?.subject;

const isCashApp =
  typeof from === "string" && /(cash\.app|square\.com)/i.test(from);

if (isCashApp) {
  const parsedCash = parseCashAppSubject(subject);

  if (parsedCash?.place) {
    await supabase
      .from("receipts")
      .update({
        ...(parsedCash.amount != null ? { amount: parsedCash.amount } : {}),
        place: parsedCash.place,
      } as any)
      .eq("id", ingest_id);
  }
}

return NextResponse.json(
  {
    ok: true,
    receipt_id: ingest_id,
    event_id,
    user_id,
    version: VERSION,
  },
  { status: 200 }
);
}