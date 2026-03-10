/* ==========================================================
   OUTFLO — PROFILE NOTIFICATIONS PAGE
   File: app/account/profile/notifications/page.tsx
   Scope: Render the notifications drill-down placeholder page
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";

/* ------------------------------
   Component
-------------------------------- */
export default function ProfileNotificationsPage() {
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
          Notifications
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
          Notification settings will control how Outflō communicates updates,
          confirmations, and important account events.
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