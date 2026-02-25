/* ==========================================================
   OUTFLO — LOGIN (GATED)
   File: app/login/page.tsx
   Scope: Only reachable via Portal (via=portal)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import LoginClient from "./login-client";

/* ------------------------------
   Page
-------------------------------- */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  // Logged in → go directly to Systems
  if (data.user) {
    redirect("/app/systems");
  }

  // Enforce Portal pass
  const via = searchParams?.via;
  const pass = Array.isArray(via) ? via[0] : via;

  if (pass !== "portal") {
    redirect("/");
  }

  return <LoginClient />;
}





