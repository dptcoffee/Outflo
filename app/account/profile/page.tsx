/* ==========================================================
   OUTFLO — ACCOUNT PROFILE PAGE
   File: app/account/profile/page.tsx
   Scope: Render the launch identity surface for the authenticated user
   ========================================================== */

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   Page
-------------------------------- */
export default async function AccountProfilePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: identity } = await supabase
    .from("user_identity_assets")
    .select("display_name, username, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("manual_city")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: aliases } = await supabase
    .from("ingest_aliases")
    .select("alias")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  const displayName = identity?.display_name?.trim() || "Not set";
  const username = identity?.username?.trim() || "";
  const avatarUrl = identity?.avatar_url?.trim() || "";
  const homeCity = preferences?.manual_city?.trim() || "Not set";

  const alias = aliases?.[0]?.alias ?? null;
  const accountNumber = alias ? alias.split("@")[0] : "Not set";

  const fallbackLetter =
    displayName && displayName !== "Not set"
      ? displayName.charAt(0).toUpperCase()
      : "O";

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "32px 20px 64px",
      }}
    >
      <section
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        ) : (
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
              border: "1px solid rgba(255,255,255,0.18)",
              }}
>
            {fallbackLetter}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 28,
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 6,
            }}
          >
            {displayName}
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.75,
              fontSize: 15,
            }}
          >
            {username ? `@${username}` : "Username not set"}
          </p>
        </div>
      </section>

      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          marginBottom: 20,
        }}
      >
        <IdentityRow label="Account" value={accountNumber} />
        <IdentityRow label="Home" value={homeCity} />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <ActionButton href="/account/profile/edit" label="Edit Profile" />
        <ActionButton href="/logout" label="Sign Out" />
      </section>

      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <NavRow href="/account/profile/edit" label="Environment" />
        <NavRow href="/account/profile" label="Email Mirror" />
        <NavRow href="/account/profile" label="Support" />
        <NavRow href="/account/profile" label="Legal" />
      </section>
    </main>
  );
}

/* ------------------------------
   Helpers
-------------------------------- */
function IdentityRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function ActionButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: 48,
        borderRadius: 14,
        textDecoration: "none",
        fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      {label}
    </Link>
  );
}

function NavRow({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "18px 0",
        textDecoration: "none",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>→</span>
    </Link>
  );
}

function StaticRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "18px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>{value}</span>
    </div>
  );
}