/* ==========================================================
   OUTFLO — LOGOUT ROUTE
   File: app/logout/route.ts
   Scope: Signs user out and returns to Portal (/)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   GET — Logout + Redirect
-------------------------------- */
export async function GET(request: Request) {
  const supabase = await supabaseServer();

  // Invalidate session
  await supabase.auth.signOut();

  // Redirect to Portal (public root)
  const url = new URL("/", request.url);
  return NextResponse.redirect(url);
}

