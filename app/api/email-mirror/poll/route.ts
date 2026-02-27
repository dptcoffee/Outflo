// app/api/email-mirror/poll/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function extractSixDigitCode(text: string): string | null {
  const m = text.match(/\b\d{6}\b/);
  return m ? m[0] : null;
}

async function fetchResendBody(resendMessageId: string): Promise<string> {
  const key = process.env.RESEND_API_KEY!;
  const r = await fetch(`https://api.resend.com/emails/${resendMessageId}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error("resend_fetch_failed");
  const json = await r.json();

  // Resend payloads vary; prefer text, fallback to html stripped-ish
  return (
    json?.text ??
    (typeof json?.html === "string" ? json.html.replace(/<[^>]*>/g, " ") : "") ??
    ""
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const nonce = url.searchParams.get("nonce");
  if (!nonce) return NextResponse.json({ error: "missing_nonce" }, { status: 400 });

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data: state } = await supabase
    .from("email_mirror_state")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (state?.verified_at) return NextResponse.json({ locked: true }, { status: 403 });

  const now = Date.now();
  const expires = state?.window_expires_at ? Date.parse(state.window_expires_at) : 0;
  if (!state?.window_nonce || state.window_nonce !== nonce) {
    return NextResponse.json({ error: "bad_nonce" }, { status: 403 });
  }
  if (!expires || now > expires) {
    return NextResponse.json({ open: false, expired: true }, { status: 403 });
  }

  // look for a likely Gmail forwarding confirmation stub (keep it loose)
  const { data: stubs } = await supabase
    .from("inbound_email_stub")
    .select("resend_message_id, subject, received_at")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(10);

  const candidate = (stubs ?? []).find(s => {
    const subj = (s.subject ?? "").toLowerCase();
    return subj.includes("forward") && subj.includes("confirm"); // minimal heuristic
  });

  if (!candidate) return NextResponse.json({ open: true, found: false });

  const body = await fetchResendBody(candidate.resend_message_id);
  const code = extractSixDigitCode(body);

  if (!code) return NextResponse.json({ open: true, found: false });

  return NextResponse.json({ open: true, found: true, code });
}