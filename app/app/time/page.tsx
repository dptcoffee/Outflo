/* ==========================================================
   OUTFLO — TIME SUBSTRATE (SERVER WRAPPER)
   File: app/app/time/page.tsx
   Route: /app/time
   Scope: Fetch cloud epoch and pass to client runtime
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import { getOrCreateUserEpochMs } from "@/lib/time/userEpoch";
import TimeClient from "./TimeClient";

/* ------------------------------
   Component
-------------------------------- */
export default async function Page() {
  const epochMs = await getOrCreateUserEpochMs();
  return <TimeClient epochMs={epochMs} />;
}