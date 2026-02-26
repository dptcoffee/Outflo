/* ==========================================================
   OUTFLO — PROCESS INGEST EVENTS
   File: app/api/admin/process-ingest/route.ts
   Scope: Claim ingest_events, bind user via ingest_aliases, upsert into receipts, mark processed_at
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------
   Types
-------------------------------- */
type IngestEventRow = {
  id: string; // uuid
  provider: string | null;
  received_at: string | null; // timestamptz
  message_id: string | null; // provider email id
  event_id: string | null; // webhook event id
  user_id: string | null; // bound user
  claimed_at: string | null; // timestamptz (processing claim)
  processed_at: string | null; // timestamptz (completion)
  raw: any; // jsonb
};

type AliasRow = {
  user_id: string;
  is_active: boolean;
  type: string | null;
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

/* ------------------------------
   Helpers
-------------------------------- */
function envOrNull(key: string): string | null {
  const v = process.env[key];
  if (!v) return null;
  const t = v.trim();
  return t.length ? t : null;
}

function isoNow(): string {
  return new Date().toISOString();
}

function bad(status: number, payload: any) {
  return NextResponse.json(payload, { status });
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

function getVaultKey(req: Request): string | null {
  const h = req.headers.get("x-outflo-vault-key");
  if (!h) return null;
  const t = h.trim();
  return t.length ? t : null;
}

function mustInt(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function extractLocalPartFromRaw(raw: any): string | null {
  const from = raw?.data?.from;
  if (typeof from !== "string") return null;

  const m = from.match(/<([^>]+)>/);
  const addr = (m ? m[1] : from).trim().toLowerCase();
  const at = addr.indexOf("@");
  if (at <= 0) return null;

  const local = addr.slice(0, at).trim();
  return local.length ? local : null;
}

function extractReceiptPlace(raw: any): string {
  const subject = raw?.data?.subject;
  if (typeof subject === "string" && subject.trim().length) return subject.trim();

  const type = raw?.type;
  if (typeof type === "string" && type.trim().length) return type.trim();

  return "ingest";
}

function extractReceiptTsMs(ev: IngestEventRow): number {
  if (ev.received_at) {
    const ms = Date.parse(ev.received_at);
    if (Number.isFinite(ms)) return ms;
  }
  return Date.now();
}

function extractReceiptAmount(_raw: any): number {
  // Parsing not enabled yet. Pipe test = 0.
  return 0;
}

/* ------------------------------
   Handler
-------------------------------- */
export async function POST(req: Request) {
  /* ------------------------------
     Auth
  -------------------------------- */
  const expectedVault = envOrNull("OUTFLO_VAULT_KEY");
  const providedVault = getVaultKey(req);

  if (expectedVault) {
    if (!providedVault || providedVault !== expectedVault) {
      return bad(401, { ok: false, where: "auth", message: "Invalid vault key" });
    }
  } else {
    return bad(500, { ok: false, where: "env", message: "Missing OUTFLO_VAULT_KEY" });
  }

  /* ------------------------------
     Supabase
  -------------------------------- */
  const svc = supabaseService();
  if (!svc.ok) return bad(500, { ok: false, where: svc.where, message: svc.message });
  const supabase = svc.client;

  /* ------------------------------
     Params
  -------------------------------- */
  const url = new URL(req.url);
  const limit = mustInt(url.searchParams.get("limit"), DEFAULT_LIMIT);

  /* ------------------------------
     Fetch unprocessed, unclaimed events
  -------------------------------- */
  const { data: events, error: fetchErr } = await supabase
    .from("ingest_events")
    .select("id, provider, received_at, message_id, event_id, user_id, claimed_at, processed_at, raw")
    .eq("provider", PROVIDER)
    .is("processed_at", null)
    .is("claimed_at", null)
    .order("received_at", { ascending: true })
    .limit(limit);

  if (fetchErr) {
    return bad(500, {
      ok: false,
      where: "db",
      message: fetchErr.message,
      step: "fetch_events",
    });
  }

  const rows = (events || []) as IngestEventRow[];

  /* ------------------------------
     Process
  -------------------------------- */
  let scanned = 0;
  let claimed = 0;
  let skipped_claimed = 0;
  let bound = 0;
  let upserted = 0;
  let processed = 0;

  for (const ev0 of rows) {
    scanned += 1;

    // 0) Claim row (concurrency seal)
    const claimAt = isoNow();

    const { data: claimedRow, error: claimErr } = await supabase
      .from("ingest_events")
      .update({ claimed_at: claimAt } as any)
      .eq("id", ev0.id)
      .is("processed_at", null)
      .is("claimed_at", null)
      .select("id, provider, received_at, message_id, event_id, user_id, claimed_at, processed_at, raw")
      .maybeSingle();

    if (claimErr) {
      return bad(500, {
        ok: false,
        where: "db",
        message: claimErr.message,
        step: "claim_event",
      });
    }

    // If we didn't get a row back, someone else claimed/processed it between fetch and claim.
    if (!claimedRow) {
      skipped_claimed += 1;
      continue;
    }

    claimed += 1;

    const ev = claimedRow as IngestEventRow;

    // 1) Ensure user_id is bound (via alias lookup)
    let userId = ev.user_id;

    if (!userId) {
      const localPart = extractLocalPartFromRaw(ev.raw);

      if (localPart) {
        const { data: alias, error: aliasErr } = await supabase
          .from("ingest_aliases")
          .select("user_id, is_active, type")
          .eq("local_part", localPart)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (aliasErr) {
          // release claim before failing
          await supabase.from("ingest_events").update({ claimed_at: null } as any).eq("id", ev.id);
          return bad(500, {
            ok: false,
            where: "db",
            message: aliasErr.message,
            step: "lookup_alias",
            local_part: localPart,
          });
        }

        const a = alias as AliasRow | null;
        if (a?.user_id) {
          userId = a.user_id;

          const { error: bindErr } = await supabase
            .from("ingest_events")
            .update({ user_id: userId } as any)
            .eq("id", ev.id);

          if (bindErr) {
            await supabase.from("ingest_events").update({ claimed_at: null } as any).eq("id", ev.id);
            return bad(500, {
              ok: false,
              where: "db",
              message: bindErr.message,
              step: "bind_user",
            });
          }

          bound += 1;
        }
      }
    }

    // If still no user, release claim and leave unprocessed/unclaimed for later binding
    if (!userId) {
      await supabase.from("ingest_events").update({ claimed_at: null } as any).eq("id", ev.id);
      continue;
    }

    // 2) Build receipt row (pipe-test minimal)
    const receiptId = ev.id; // law: 1 ingest_event => 1 receipt
    const ts = extractReceiptTsMs(ev);
    const place = extractReceiptPlace(ev.raw);
    const amount = extractReceiptAmount(ev.raw);
    const raw = {
      source: "ingest",
      provider: ev.provider,
      event_id: ev.event_id,
      message_id: ev.message_id,
      received_at: ev.received_at,
      payload: ev.raw,
    };

    // 3) Upsert into receipts (idempotent on id)
    const { error: upsertErr } = await supabase
      .from("receipts")
      .upsert(
        {
          id: receiptId,
          user_id: userId,
          ts,
          place,
          amount,
          raw,
        } as any,
        { onConflict: "id" }
      );

    if (upsertErr) {
      const e = upsertErr as unknown as DbErrorLike;
      await supabase.from("ingest_events").update({ claimed_at: null } as any).eq("id", ev.id);
      return bad(500, {
        ok: false,
        where: "db",
        message: e.message || "Receipt upsert failed",
        code: e.code || null,
        step: "upsert_receipt",
      });
    }

    upserted += 1;

    // 4) Mark ingest event processed + release claim
    const processedAt = isoNow();

    const { error: markErr } = await supabase
      .from("ingest_events")
      .update({ processed_at: processedAt, claimed_at: null } as any)
      .eq("id", ev.id)
      .is("processed_at", null);

    if (markErr) {
      return bad(500, {
        ok: false,
        where: "db",
        message: markErr.message,
        step: "mark_processed",
      });
    }

    processed += 1;
  }

  /* ------------------------------
     Response
  -------------------------------- */
  return NextResponse.json(
    {
      ok: true,
      provider: PROVIDER,
      limit,
      scanned,
      claimed,
      skipped_claimed,
      bound,
      upserted,
      processed,
      version: "process-ingest-v2-claimed",
      note: "Concurrency sealed via ingest_events.claimed_at; completion uses processed_at.",
    },
    { status: 200 }
  );
}