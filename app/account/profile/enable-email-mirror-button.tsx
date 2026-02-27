"use client";

/* ==========================================================
   OUTFLO — ENABLE EMAIL MIRROR BUTTON
   File: app/account/profile/enable-email-mirror-button.tsx
   Scope: Open 2-minute window + navigate to Email Mirror verification page
   ========================================================== */

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EnableEmailMirrorButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);

    try {
      // Email Mirror namespace (not forwarding)
      const r = await fetch("/api/email-mirror/open", {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      // even if open fails, don't brick profile—just stop
      if (!r.ok) return;

      router.push("/account/email-mirror");
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