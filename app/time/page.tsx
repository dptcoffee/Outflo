/* ==========================================================
   OUTFLO — TIME LEGACY REDIRECT
   File: app/time/page.tsx
   Scope: /time → /app/time (redirect only; no product logic)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { redirect } from "next/navigation";

/* ------------------------------
   Component
-------------------------------- */
export default function TimeLegacyRedirect() {
  redirect("app/time");
}


