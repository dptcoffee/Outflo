/* ==========================================================
   OUTFLO — POLL FOR FORWARDING VERIFICATION CODE
   File: app/api/forwarding/poll/route.ts
   Scope: During the 2-minute aperture, detect Gmail forwarding confirmation email, fetch body on-demand from Resend, extract 6-digit code, hard-lock on success
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------
   Constants
-------------------------------- */
export const runtime = "nodejs";

const WINDOW_MS = 2 * 60 * 1000;
const RESEND_RECEIVED_EMAIL_ENDPOINT = "https://api.resend.com/emails/receiving";
const PROVIDER = "resend";

/* ------------------------------
   Types
-------------------------------- */
type ForwardingRow = {
  user_id: string;
  window_opened_at: string | null;
  verified_at: string | null;
  locked_at: string | null;
};

type IngestEventRow = {
  id: string;
  message_id: string | null;
  received_at: string | null;
  raw: any;
};

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

function safeMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function normalize(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function supabaseService() {
  const url =
    envOrNull("SUPABASE_URL") || envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const key = envOrNull("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

async function authedUserId(req: Request): Promise<string | null> {
  const supabaseUrl =
    envOrNull("SUPABASE_URL") || envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anon) return null;

  const authHdr = req.headers.get("authorization");
  if (!authHdr || !authHdr.toLowerCase().startsWith("bearer ")) return null;

  const token = authHdr.slice("bearer ".length).trim();
  if (!token.length) return null;

  const supabase = createClient(supabaseUrl, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) return null;

  return data.user.id;
}

function looksLikeGmailForwardingConfirm(raw: any): boolean {
  const from = normalize(raw?.data?.from).toLowerCase();
  const subject = normalize(raw?.data?.subject).toLowerCase();

  const fromOk =
    from.includes("forwarding-noreply@google.com") ||
    from.includes("no-reply@accounts.google.com") ||
    from.includes("google.com");

  const subjectOk =
    subject.includes("gmail forwarding confirmation") ||
    subject.includes("forwarding confirmation");

  return (fromOk && subjectOk) || subject.includes("gmail forwarding");
}

function extract6DigitCode(text: string): string | null {
  const m = text.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

async function fetchReceivedEmailBody(args: {
  received_email_id: string;
}): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) return { ok: false, error: "missing_resend_api_key" };

  const url = `${RESEND_RECEIVED_EMAIL_ENDPOINT}/${encodeURIComponent(
    args.received_email_id
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return { ok: false, error: `resend_fetch_failed_${res.status}` };
  }

  const json = (await res.json()) as any;
  const html = normalize(json?.html);
  const text = normalize(json?.text);

  const body = text.length ? text : html;
  if (!body.length) return { ok: false, error: "empty_body" };

  return { ok: true, body };
}

/* ------------------------------
   Handler
-------------------------------- */
export async function GET(req: Request) {
  const user_id = await authedUserId(req);
  if (!user_id) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const supabase = supabaseService();
  if (!supabase) {
    return NextResponse.json({ status: "service_unavailable" }, { status: 500 });
  }

  const { data: fwd, error: fwdErr } = await supabase
    .from("forwarding_verifications")
    .select("user_id, window_opened_at, verified_at, locked_at")
    .eq("user_id", user_id)
    .maybeSingle<ForwardingRow>();

  if (fwdErr) {
    return NextResponse.json({ status: "read_failed" }, { status: 500 });
  }

  if (fwd?.verified_at || fwd?.locked_at) {
    return NextResponse.json({ status: "locked" }, { status: 200 });
  }

  const openedMs = safeMs(fwd?.window_opened_at ?? null);
  if (!openedMs) {
    return NextResponse.json({ status: "closed" }, { status: 200 });
  }

  const age = Date.now() - openedMs;
  if (age > WINDOW_MS) {
    await supabase
      .from("forwarding_verifications")
      .update({ window_opened_at: null } as any)
      .eq("user_id", user_id);

    return NextResponse.json({ status: "expired" }, { status: 200 });
  }

  const { data: events, error: evErr } = await supabase
    .from("ingest_events")
    .select("id, message_id, received_at, raw")
    .eq("user_id", user_id)
    .eq("provider", PROVIDER)
    .order("received_at", { ascending: false })
    .limit(25)
    .returns<IngestEventRow[]>();

  if (evErr) {
    return NextResponse.json({ status: "ingest_read_failed" }, { status: 500 });
  }

  const match = (events || []).find((e) => looksLikeGmailForwardingConfirm(e.raw));
  const receivedEmailId = normalize(match?.message_id);

  if (!receivedEmailId.length) {
    return NextResponse.json({ status: "waiting" }, { status: 200 });
  }

  const bodyRes = await fetchReceivedEmailBody({ received_email_id: receivedEmailId });
  if (!bodyRes.ok) {
    return NextResponse.json({ status: "waiting" }, { status: 200 });
  }

  const code = extract6DigitCode(bodyRes.body);
  if (!code) {
    return NextResponse.json({ status: "waiting" }, { status: 200 });
  }

  await supabase
    .from("forwarding_verifications")
    .update({ verified_at: isoNow(), locked_at: isoNow() } as any)
    .eq("user_id", user_id);

  return NextResponse.json({ status: "found", code }, { status: 200 });
}