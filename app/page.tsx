/* ==========================================================
   OUTFLO — PUBLIC ROOT (PORTAL)
   File: app/page.tsx
   Scope: Public entry surface; initializes session if present then renders portal
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { supabaseServer } from "@/lib/supabase/server";
import Portal from "@/components/Portal";

/* ------------------------------
   Component
-------------------------------- */
export default async function Page() {
  await supabaseServer(); // initializes session if present (public-safe)
  return <Portal />;
}










