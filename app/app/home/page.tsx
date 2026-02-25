/* ==========================================================
   OUTFLO — APP HOME REDIRECT
   File: app/app/home/page.tsx
   Scope: Redirects legacy /app/home to public portal (/)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { redirect } from "next/navigation";

/* ------------------------------
   Component
-------------------------------- */
export default function Page() {
  redirect("/");
}