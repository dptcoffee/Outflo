import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // If no code, bounce to login (still safe)
  if (!code) {
    return NextResponse.redirect(new URL("/login", url));
  }

  const supabase = await supabaseServer();
  await supabase.auth.exchangeCodeForSession(code);

  // ✅ ALWAYS HOME after login
  return NextResponse.redirect(new URL("/", url));
}


