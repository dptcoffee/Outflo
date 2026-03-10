/* ==========================================================
   OUTFLO — PROFILE INVITE PAGE
   File: app/account/profile/invite/page.tsx
   Scope: Render the invite drill-down placeholder page
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";

/* ------------------------------
   Component
-------------------------------- */
export default function ProfileInvitePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 20px 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Invite Friends
        </h1>

        <p
          style={{
            margin: "12px 0 0",
            maxWidth: 560,
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.68)",
          }}
        >
          Invite tools will allow you to share Outflō with others through simple links,
          referrals, and onboarding pathways.
        </p>

        <div style={{ marginTop: 24 }}>
          <Link
            href="/account/profile"
            style={{
              color: "rgba(255,255,255,0.82)",
              textDecoration: "none",
            }}
          >
            ← Back to Profile
          </Link>
        </div>
      </div>
    </main>
  );
}