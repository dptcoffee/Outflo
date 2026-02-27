/* ==========================================================
   OUTFLO — RESEND INGEST WEBHOOK (INSTANT STUB)
   File: app/api/ingest/resend/route.ts
   Scope: Receive Resend webhook, bind user via ingest_aliases, persist ingest_events, create receipt stub immediately (idempotent)
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
const VERSION = "ingest-resend-v3-instant-stub";

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
  // Bind user based on the recipient alias address:
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

function extractReceiptPlace(payload: ResendWebhookPayload): string {
  const subject = payload?.data?.subject;
  if (typeof subject === "string" && subject.trim().length) return subject.trim();

  const type = payload?.type;
  if (typeof type === "string" && type.trim().length) return type.trim();

  return "ingest";
}

function receivedAtToTsMs(received_at: string): number {
  const ms = Date.parse(received_at);
  if (Number.isFinite(ms)) return ms;
  return Date.now();
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

async function ensureReceiptStub(args: {
  supabase: SupabaseClient<any>;
  ingest_id: string;
  user_id: string;
  provider: string;
  event_id: string;
  message_id: string | null;
  received_at: string;
  payload: ResendWebhookPayload;
}): Promise<{ ok: true } | { ok: false; step: string; message: string; code: string | null }> {
  const { supabase, ingest_id, user_id, provider, event_id, message_id, received_at, payload } = args;

  const ts = receivedAtToTsMs(received_at);
  const place = extractReceiptPlace(payload);
  const amount = 0;

  const raw = {
    source: "ingest",
    provider,
    event_id,
    message_id,
    received_at,
    payload,
  };

  /* ------------------------------
     Upsert receipt stub
  -------------------------------- */
  const { error: upsertErr } = await supabase
    .from("receipts")
    .upsert(
      {
        id: ingest_id,
        user_id,
        ts,
        place,
        amount,
        raw,
      } as any,
      { onConflict: "id" }
    );

  if (upsertErr) {
    const e = upsertErr as unknown as DbErrorLike;
    return {
      ok: false,
      step: "upsert_receipt",
      message: e.message || "Receipt upsert failed",
      code: e.code || null,
    };
  }

  /* ------------------------------
     Mark ingest_event processed
  -------------------------------- */
  const processedAt = isoNow();

  const { error: markErr } = await supabase
    .from("ingest_events")
    .update({ processed_at: processedAt, receipt_id: ingest_id, process_error: null } as any)
    .eq("id", ingest_id);

  if (markErr) {
    return {
      ok: false,
      step: "mark_processed",
      message: markErr.message || "Mark processed failed",
      code: null,
    };
  }

  return { ok: true };
}

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  /* ------------------------------
     Env + client
  -------------------------------- */
  const svc = supabaseService();
  if (!svc.ok) {
    return NextResponse.json({ ok: false, where: svc.where, message: svc.message, version: VERSION }, { status: 500 });
  }
  const supabase = svc.client;

  /* ------------------------------
     Read body
  -------------------------------- */
  const rawText = await req.text();
  const parsed = safeJsonParse<ResendWebhookPayload>(rawText);

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, where: "payload", message: `Invalid JSON: ${parsed.error}`, version: VERSION },
      { status: 400 }
    );
  }

  const payload = parsed.value;

  /* ------------------------------
     Extract ids + alias local_part
  -------------------------------- */
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

  /* ------------------------------
     Resolve user_id from ingest_aliases
  -------------------------------- */
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
    // Unknown alias. Do not write ingest_event.
    return NextResponse.json(
      { ok: false, where: "alias", message: `No active alias for local_part=${local_part}`, version: VERSION },
      { status: 404 }
    );
  }

  /* ------------------------------
     Insert ingest event (idempotent on event_id)
  -------------------------------- */
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
    const e = insErr as unknown as DbErrorLike;

    /* ------------------------------
       Replay / dedupe (heal if needed)
    -------------------------------- */
    if (e.code === "23505") {
      const { data: existing, error: fetchExistingErr } = await supabase
        .from("ingest_events")
        .select("id, user_id, processed_at")
        .eq("event_id", event_id)
        .maybeSingle();

      if (fetchExistingErr) {
        return NextResponse.json(
          { ok: false, where: "db", message: fetchExistingErr.message, step: "fetch_existing", version: VERSION },
          { status: 500 }
        );
      }

      const existingId = (existing as any)?.id as string | undefined;
      const existingUserId = (existing as any)?.user_id as string | undefined;
      const existingProcessedAt = (existing as any)?.processed_at as string | null | undefined;

      if (existingId && existingUserId && !existingProcessedAt) {
        const stub = await ensureReceiptStub({
          supabase,
          ingest_id: existingId,
          user_id: existingUserId,
          provider: PROVIDER,
          event_id,
          message_id: email_id,
          received_at,
          payload,
        });

        if (!stub.ok) {
          await supabase
            .from("ingest_events")
            .update({ process_error: `${stub.step}: ${stub.message}` } as any)
            .eq("id", existingId);

          return NextResponse.json(
            {
              ok: false,
              where: "db",
              message: stub.message,
              code: stub.code,
              step: stub.step,
              version: VERSION,
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { ok: true, deduped: true, healed: true, event_id, local_part, user_id: existingUserId, version: VERSION },
          { status: 200 }
        );
      }

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

  /* ------------------------------
     Create receipt stub + mark processed
  -------------------------------- */
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
    await supabase
      .from("ingest_events")
      .update({ process_error: `${stub.step}: ${stub.message}` } as any)
      .eq("id", ingest_id);

    return NextResponse.json(
      { ok: false, where: "db", message: stub.message, code: stub.code, step: stub.step, version: VERSION },
      { status: 500 }
    );
  }

  /* ------------------------------
     Success
  -------------------------------- */
  return NextResponse.json(
    {
      ok: true,
      inserted_id: ingest_id,
      receipt_id: ingest_id,
      event_id,
      local_part,
      user_id,
      version: VERSION,
      note: "Instant stub created; manual processor no longer required for receipt existence.",
    },
    { status: 200 }
  );
}