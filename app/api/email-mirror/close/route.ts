import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { nonce } = await req.json().catch(() => ({}));
  if (!nonce) return NextResponse.json({ error: "missing_nonce" }, { status: 400 });

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data: state } = await supabase
    .from("email_mirror_state")
    .select("window_nonce, verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!state || state.window_nonce !== nonce) {
    return NextResponse.json({ error: "bad_nonce" }, { status: 403 });
  }

  if (!state.verified_at) {
    await supabase.from("email_mirror_state").update({
      verified_at: new Date().toISOString(),
      window_opened_at: null,
      window_expires_at: null,
      window_nonce: null,
    }).eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}