/* ==========================================================
   OUTFLO — PUBLIC ROOT
   File: app/page.tsx
   Scope: "/" → Portal surface with epoch-aware ms hum
   Rules:
     - Logged in  → fetch cloud epoch
     - Logged out → epochMs = null (Unix fallback in Portal)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { supabaseServer } from "@/lib/supabase/server";
import { getOrCreateUserEpochMs } from "@/lib/time/userEpoch";
import Portal from "@/components/Portal";

/* ------------------------------
   Component
-------------------------------- */
export default async function Page() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let epochMs: number | null = null;

  if (user) {
    epochMs = await getOrCreateUserEpochMs();
  }

  return <Portal epochMs={epochMs} />;
}










