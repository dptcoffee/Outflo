/* ==========================================================
   OUTFLO — ACCOUNT NAMESPACE LAYOUT (PROTECTED)
   File: app/account/layout.tsx
   Scope: Protects /account/*
   Behavior: Logged out → Portal (/)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   Layout Gate
-------------------------------- */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  // Logged out → redirect to Portal
  if (!data.user) {
    redirect("/");
  }

  return <>{children}</>;
}