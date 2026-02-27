import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const WINDOW_MS = 2 * 60 * 1000;

export async function POST() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  // state table: email_mirror_state (you may already have it or equivalent)
  const { data: state } = await supabase
    .from("email_mirror_state")
    .select("verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (state?.verified_at) return NextResponse.json({ error: "locked" }, { status: 403 });

  const nonce = crypto.randomUUID().replaceAll("-", "");
  const opened = new Date();
  const expires = new Date(opened.getTime() + WINDOW_MS);

  await supabase.from("email_mirror_state").upsert({
    user_id: user.id,
    window_opened_at: opened.toISOString(),
    window_expires_at: expires.toISOString(),
    window_nonce: nonce,
  });

  return NextResponse.json({ nonce, expires_at: expires.toISOString() });
}