/* ==========================================================
   OUTFLO — LOGIN (PUBLIC)
   File: app/login/page.tsx
   Scope: Public entry; redirects to /app/systems if already authed
   ========================================================== */

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import LoginClient from "./login-client";

export default async function LoginPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  // Logged in → go directly to Systems
  if (data.user) {
    redirect("/app/systems");
  }

  // Logged out → render login UI
  return <LoginClient />;
}





