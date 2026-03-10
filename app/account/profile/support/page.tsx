/* ==========================================================
   OUTFLO — PROFILE SUPPORT PAGE
   File: app/account/profile/support/page.tsx
   Scope: Render the support drill-down placeholder page
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";

/* ------------------------------
   Component
-------------------------------- */
export default function ProfileSupportPage() {
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
          Support
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
          Support will provide help, guidance, and clear next steps when you need
          assistance inside Outflō.
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