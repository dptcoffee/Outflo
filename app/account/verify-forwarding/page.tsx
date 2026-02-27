/* ==========================================================
   OUTFLO — VERIFY FORWARDING APERTURE (PAGE)
   File: app/account/verify-forwarding/page.tsx
   Scope: Hosts the verification aperture UI (poll + copy + close); access/lock enforced by API + client redirect
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import VerifyForwardingClient from "./verify-forwarding-client.";

/* ------------------------------
   Component
-------------------------------- */
export default function VerifyForwardingPage() {
  return <VerifyForwardingClient />;
}