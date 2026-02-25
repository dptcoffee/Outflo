/* ==========================================================
   OUTFLO — APP NAMESPACE LAYOUT (PROTECTED)
   File: app/app/layout.tsx
   Scope: Protects /app/*
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
export default async function AppLayout({
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
