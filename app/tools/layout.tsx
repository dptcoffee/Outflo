/* ==========================================================
   OUTFLO — TOOLS NAMESPACE LAYOUT (PROTECTED)
   File: app/tools/layout.tsx
   Scope: Protects /tools/*
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
export default async function ToolsLayout({
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