/* ==========================================================
   OUTFLO — PROFILE HUB PAGE
   File: app/account/profile/page.tsx
   Scope: Render the canonical profile hub for account navigation
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   Constants
-------------------------------- */
const HUB_ITEMS = [
  { label: "Account", href: "/account/profile/account" },
  { label: "Environment", href: "/account/profile/environment" },
  { label: "Money", href: "/account/profile/money" },
  { label: "Privacy", href: "/account/profile/privacy" },
  { label: "Notifications", href: "/account/profile/notifications" },
  { label: "Records", href: "/account/profile/records" },
  { label: "Invite Friends", href: "/account/profile/invite" },
  { label: "Support", href: "/account/profile/support" },
] as const;

const FOOTER_ITEMS = [
  { label: "Privacy Notice", href: "/account/profile/privacy" },
  { label: "Terms of Service", href: "/account/profile/support" },
  { label: "References", href: "/account/profile/records" },
] as const;

/* ------------------------------
   Helpers
-------------------------------- */
function getDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "";

  if (metadataName) return metadataName;
  if (user.email) return user.email.split("@")[0];
  return "Outflo User";
}

function getUsername(user: { user_metadata?: Record<string, unknown> }) {
  const raw =
    typeof user.user_metadata?.username === "string"
      ? user.user_metadata.username.trim().replace(/^@+/, "")
      : "";

  return raw ? `@${raw}` : "@username";
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "O";
}

function getGradientForLetter(letter: string) {
  const gradients = [
    "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)",
    "linear-gradient(135deg, #111827 0%, #7c3aed 100%)",
    "linear-gradient(135deg, #172554 0%, #0ea5e9 100%)",
    "linear-gradient(135deg, #1f2937 0%, #14b8a6 100%)",
    "linear-gradient(135deg, #312e81 0%, #ec4899 100%)",
    "linear-gradient(135deg, #3f3f46 0%, #f59e0b 100%)",
  ];

  const index = letter.charCodeAt(0) % gradients.length;
  return gradients[index];
}

/* ------------------------------
   Component
-------------------------------- */
export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const user = data.user;
  const displayName = getDisplayName(user);
  const username = getUsername(user);
  const initial = getInitial(displayName);
  const avatarBackground = getGradientForLetter(initial);

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
        {/* --- UI: Profile — Identity ---------------------------- */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 88,
                height: 88,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontSize: 28,
                fontWeight: 700,
                background: avatarBackground,
                border: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            >
              {initial}

              <Link
                href="/account/profile/edit"
                aria-label="Edit profile photo"
                style={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  textDecoration: "none",
                  color: "#ffffff",
                  fontSize: 13,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  backdropFilter: "blur(8px)",
                }}
              >
                ✎
              </Link>
            </div>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: 28,
                  lineHeight: 1.1,
                  fontWeight: 700,
                }}
              >
                {displayName}
              </h1>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "rgba(255,255,255,0.64)",
                  fontSize: 15,
                }}
              >
                {username}
              </p>
            </div>
          </div>

          <div>
            <Link
              href="/account/profile/edit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 999,
                textDecoration: "none",
                color: "#ffffff",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              Edit Profile
            </Link>
          </div>
        </section>

        {/* --- UI: Profile — Navigation -------------------------- */}
        <section
          style={{
            marginTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 12,
          }}
        >
          <nav aria-label="Profile hub navigation">
            {HUB_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 56,
                  textDecoration: "none",
                  color: "#ffffff",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.label}</span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.42)",
                    fontSize: 18,
                  }}
                >
                  ›
                </span>
              </Link>
            ))}
          </nav>
        </section>

        {/* --- UI: Profile — Statement --------------------------- */}
        <section
          style={{
            marginTop: 28,
          }}
        >
          <p
            style={{
              margin: 0,
              maxWidth: 620,
              color: "rgba(255,255,255,0.60)",
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            Outflō is a personal telemetry system built around time. It records
            events across money, time, and environment so patterns in what
            leaves you can be seen more clearly. Outflō does not hold funds and
            is not a bank.
          </p>
        </section>

        {/* --- UI: Profile — Footer ------------------------------ */}
        <section
          style={{
            marginTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 12,
          }}
        >
          <nav aria-label="Institutional links">
            {FOOTER_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 48,
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.82)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 15 }}>{item.label}</span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.42)",
                    fontSize: 18,
                  }}
                >
                  ›
                </span>
              </Link>
            ))}
          </nav>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              color: "rgba(255,255,255,0.50)",
              fontSize: 13,
            }}
          >
            <span>Social</span>
            <span>Version 0.1.0</span>
          </div>
        </section>
      </div>
    </main>
  );
}