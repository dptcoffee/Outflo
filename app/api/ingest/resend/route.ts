/* ==========================================================
   OUTFLO — RESEND WEBHOOK INGEST (ROUTING V1)
   File: app/api/ingest/resend/route.ts
   Scope: Accept Resend webhook, resolve alias → user_id, log ingest event
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------
   Types
-------------------------------- */
type ResendWebhookBody = {
  id?: string;
  to?: string | string[];
  headers?: Record<string, string | undefined>;
  message_id?: string;
};

/* ------------------------------
   Helpers
-------------------------------- */
function firstTo(body: ResendWebhookBody): string | null {
  const to = body?.to;
  if (!to) return null;
  if (Array.isArray(to)) return to[0] ?? null;
  return to;
}

function localPartOf(email: string): string | null {
  const idx = email.indexOf("@");
  if (idx <= 0) return null;
  return email.slice(0, idx);
}

function messageIdOf(body: ResendWebhookBody): string | null {
  const headerMid = body?.headers?.["message-id"];
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

  return createClient(url, key);
}

/* ------------------------------
   Route
-------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ResendWebhookBody;

    const to = firstTo(body);
    if (!to) return NextResponse.json({ ok: true });

    const localPart = localPartOf(to);
    if (!localPart) return NextResponse.json({ ok: true });

    const messageId = messageIdOf(body);
    if (!messageId) return NextResponse.json({ ok: true });

    const supabase = supabaseService();

    // Resolve alias → user_id
    const { data: alias, error: aliasErr } = await supabase
      .from("ingest_aliases")
      .select("user_id")
      .eq("local_part", localPart)
      .single();

    if (aliasErr || !alias?.user_id) {
      // Not our alias (or not found) — accept quietly to avoid webhook retries
      return NextResponse.json({ ok: true });
    }

    // Insert ingest event (unique constraint handles dedupe)
    const { error: insertErr } = await supabase.from("ingest_events").insert({
      user_id: alias.user_id,
      message_id: messageId,
      provider: "resend",
    });

    if (insertErr) {
      // If duplicate or other constraint issue, still acknowledge webhook
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OUTFLO — ingest/resend error:", err);
    return NextResponse.json({ ok: true });
  }
}