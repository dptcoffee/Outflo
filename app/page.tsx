/* ==========================================================
   OUTFLO — PUBLIC ROOT
   File: app/page.tsx
   Scope: "/" → Always Portal (public surface)
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
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public root always renders Portal
  return <Portal epochMs={null} />;
}









