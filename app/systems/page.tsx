/* ==========================================================
   OUTFLO — SYSTEMS REDIRECT (LEGACY)
   File: app/systems/page.tsx
   Scope: Redirect legacy route to canonical systems root
   ========================================================== */

import { redirect } from "next/navigation";

export default function SystemsRedirect(): never {
  redirect("/app/systems");
}