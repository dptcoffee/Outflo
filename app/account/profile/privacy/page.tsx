/* ==========================================================
   OUTFLO — PROFILE PRIVACY PAGE
   File: app/account/profile/privacy/page.tsx
   Scope: Render the privacy drill-down placeholder page
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";

/* ------------------------------
   Component
-------------------------------- */
export default function ProfilePrivacyPage() {
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
          Privacy
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
          Privacy controls will let you choose how Outflō uses account context,
          telemetry, and related data permissions.
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