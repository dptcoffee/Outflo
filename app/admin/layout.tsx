/* ==========================================================
   OUTFLO — ADMIN NAMESPACE LAYOUT (PROTECTED)
   File: app/admin/layout.tsx
   Scope: Protects /admin/*
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
export default async function AdminLayout({
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