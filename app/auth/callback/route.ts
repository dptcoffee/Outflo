/* ==========================================================
   OUTFLO — AUTH CALLBACK (API)
   File: app/auth/callback/route.ts
   Scope: Handles auth code exchange and session creation
   Behavior: Redirects to root after successful authentication
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   GET Handler
-------------------------------- */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Missing code → redirect to login
  if (!code) {
    return NextResponse.redirect(new URL("/login", url));
  }

  const supabase = await supabaseServer();
  await supabase.auth.exchangeCodeForSession(code);

  // After auth → return to Portal
  return NextResponse.redirect(new URL("/", url));
}