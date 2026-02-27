/* ==========================================================
   OUTFLO — PROFILE PAGE
   File: app/account/profile/page.tsx
   Scope: Render authenticated identity surface with basic account actions
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";
import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";

/* ------------------------------
   Component
-------------------------------- */
export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "black",
        color: "white",
        padding: "max(28px, 6vh) 24px",
        display: "grid",
        alignContent: "start",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 14 }}>
          identity
        </div>

        <div style={{ fontSize: 22, fontWeight: 650, marginBottom: 8 }}>
          Profile
        </div>

        <div style={{ opacity: 0.75, marginBottom: 28 }}>
          {data.user.email}
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 20,
            padding: "18px 20px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.6 }}>Password reset</div>
          <div style={{ marginTop: 6, fontSize: 14 }}>Coming soon</div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 20,
            padding: "18px 20px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.6 }}>Email Mirror</div>
          <div style={{ marginTop: 10 }}>
            <EnableEmailMirrorButton />
          </div>
        </div>

        <Link
          href="/logout"
          style={{
            display: "inline-block",
            marginTop: 20,
            fontSize: 14,
            opacity: 0.8,
            textDecoration: "none",
            color: "white",
          }}
        >
          Log out
        </Link>
      </div>
    </main>
  );
}

/* ------------------------------
   Helpers
-------------------------------- */

function EnableEmailMirrorButton() {
  "use client";

  // NOTE: Client-only function nested in the same file.
  // No imports required beyond this file’s server imports.

  const { useRouter } = require("next/navigation") as typeof import("next/navigation");
  const React = require("react") as typeof import("react");

  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await fetch("/api/forwarding/open", {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      router.push("/account/verify-forwarding");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        padding: "10px 14px",
        fontSize: 14,
        fontWeight: 700,
        cursor: busy ? "default" : "pointer",
        borderRadius: 12,
        opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? "Opening…" : "Enable Email Mirror"}
    </button>
  );
}

