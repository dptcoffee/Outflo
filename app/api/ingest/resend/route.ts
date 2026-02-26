/* ==========================================================
   OUTFLO — RESEND WEBHOOK INGEST (ROUTING V1) — HARD TRUTH
   File: app/api/ingest/resend/route.ts
   Scope: Accept Resend webhook, resolve alias → user_id, log ingest event
   ========================================================== */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // avoid edge/env weirdness while debugging

type ResendWebhookBody = {
  id?: string;
  to?: string | string[];
  headers?: Record<string, string | undefined>;
  message_id?: string;
};

function firstTo(body: ResendWebhookBody): string | null {
  const to = body?.to;
  if (!to) return null;
  if (Array.isArray(to)) return to[0] ?? null;
  return to;
}

// Accepts: "alias@x.com" OR "Name <alias@x.com>"
function extractEmail(raw: string): string | null {
  const s = raw.trim();
  const m = s.match(/<([^>]+)>/);
  const candidate = (m?.[1] ?? s).trim();
  // very light validation
  if (!candidate.includes("@")) return null;
  return candidate;
}

function localPartOf(email: string): string | null {
  const idx = email.indexOf("@");
  if (idx <= 0) return null;
  return email.slice(0, idx).trim().toLowerCase();
}

// Resend/SMTP headers can be different-cased; normalize keys
function messageIdOf(body: ResendWebhookBody): string | null {
  const headers = body?.headers ?? {};
  const lower: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;

  const headerMid = lower["message-id"];
  if (headerMid && typeof headerMid === "string") return headerMid;

  if (body?.message_id && typeof body.message_id === "string") return body.message_id;
  if (body?.id && typeof body.id === "string") return body.id;

  return null;
}

function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  const hitAt = new Date().toISOString();

  try {
    const body = (await req.json()) as ResendWebhookBody;

    const rawTo = firstTo(body);
    const email = rawTo ? extractEmail(rawTo) : null;
    const localPart = email ? localPartOf(email) : null;
    const messageId = messageIdOf(body);

    console.log("OUTFLO ingest/resend HIT", {
      hitAt,
      rawTo,
      email,
      localPart,
      messageId,
    });

    // If we can't route it, acknowledge quietly (no retries)
    if (!localPart || !messageId) return NextResponse.json({ ok: true });

    const supabase = supabaseService();

    // Resolve alias → user_id
    const { data: alias, error: aliasErr } = await supabase
      .from("ingest_aliases")
      .select("user_id")
      .eq("local_part", localPart)
      .single();

    if (aliasErr || !alias?.user_id) {
      console.log("OUTFLO ingest/resend NOT OUR ALIAS", { hitAt, localPart, aliasErr });
      return NextResponse.json({ ok: true });
    }

    // Insert ingest event — request returning id to CONFIRM persistence
    const { data: inserted, error: insertErr } = await supabase
      .from("ingest_events")
      .insert({
        user_id: alias.user_id,
        message_id: messageId,
        provider: "resend",
      })
      .select("id")
      .single();

    if (insertErr) {
      const code = (insertErr as any).code;

      // Unique violation (dedupe) → acknowledge 200 so Resend stops retrying
      if (code === "23505") {
        console.log("OUTFLO ingest/resend DUPLICATE", { hitAt, messageId });
        return NextResponse.json({ ok: true, deduped: true });
      }

      // Any other DB failure → 500 (your stated goal)
      console.error("OUTFLO ingest/resend DB INSERT FAILED", {
        hitAt,
        message: insertErr.message,
        code,
        details: (insertErr as any).details,
        hint: (insertErr as any).hint,
      });

      return NextResponse.json(
        { ok: false, where: "db_insert", message: insertErr.message, code },
        { status: 500 }
      );
    }

    // ✅ First successful write proof:
    console.log("OUTFLO ingest/resend INSERTED", { hitAt, id: inserted?.id });

    return NextResponse.json({ ok: true, inserted_id: inserted?.id });
  } catch (err: any) {
    console.error("OUTFLO ingest/resend FATAL", { hitAt, err: err?.message ?? err });
    // Fatal parse/runtime error → 500 (so you see it)
    return NextResponse.json({ ok: false, where: "catch" }, { status: 500 });
  }
}