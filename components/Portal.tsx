/* ==========================================================
   OUTFLO — PORTAL (ASSET-BASED)
   File: components/Portal.tsx
   Scope: Public portal UI; uses shipped icon asset and fades to /login
   Add: 13-digit millisecond hum (epoch-aware)
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------
   Component
-------------------------------- */
export default function Portal({
  epochMs,
}: {
  epochMs: number | null;
}) {
  const router = useRouter();
  const [fading, setFading] = useState(false);

  // Hydration-safe ticking
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30);
    return () => window.clearInterval(id);
  }, []);

  const ms = useMemo(() => {
    if (now == null) return "";

    const value =
      epochMs != null ? now - epochMs : now;

    // Always 13 digits
    return String(value).padStart(13, "0");
  }, [now, epochMs]);

  function enter() {
    if (fading) return;
    setFading(true);
    setTimeout(() => router.push("/login?via=portal"), 400);
  }

  return (
    <main
      onClick={enter}
      aria-label="Outflō portal — tap to enter"
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "opacity 400ms ease",
        opacity: fading ? 0 : 1,
        position: "relative",
      }}
    >
      {/* Top-left millisecond hum */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          fontSize: 13,               // smaller
          color: "#fffefa",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.06em",
          opacity: 0.85,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {ms}
      </div>

      <Image
        src="/icon.jpg"
        alt="Outflō"
        width={320}
        height={320}
        priority
      />
    </main>
  );
}