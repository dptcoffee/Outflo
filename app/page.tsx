/* ==========================================================
   OUTFLO — PUBLIC ROOT
   File: app/page.tsx
   Scope: "/" → Always Portal (Unix if logged out, Epoch if logged in)
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

  // Logged in → fetch cloud epoch
  if (user) {
    const epochMs = await getOrCreateUserEpochMs();
    return <Portal epochMs={epochMs} />;
  }

  // Logged out → Unix time
  return <Portal epochMs={null} />;
}








