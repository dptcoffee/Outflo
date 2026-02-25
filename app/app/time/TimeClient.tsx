/* ==========================================================
   OUTFLO — TIME SUBSTRATE (CLIENT)
   File: app/app/time/TimeClient.tsx
   Route: /app/time
   Scope: HH:MM:SS + 365-day cycle % from cloud epoch
   Notes: Hydration-safe (no Date.now() during SSR render)
   ========================================================== */

/* ------------------------------
   Client Directive
-------------------------------- */
"use client";

/* ------------------------------
   Imports
-------------------------------- */
import { useEffect, useMemo, useState } from "react";

/* ------------------------------
   Constants
-------------------------------- */
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/* ------------------------------
   Helpers
-------------------------------- */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/* ------------------------------
   Component
-------------------------------- */
export default function TimeClient({
  epochMs,
}: {
  epochMs: number | null;
}) {
  // Hydration-safe: server renders a stable null; client sets real time after mount
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Initialize immediately on client, then tick
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  const { hhmmss, pct } = useMemo(() => {
    if (now == null) return { hhmmss: "00:00:00", pct: 0 };

    const elapsedMs = epochMs == null ? now : now - epochMs;

    const cycleMs = ((elapsedMs % YEAR_MS) + YEAR_MS) % YEAR_MS;

    const totalSeconds = Math.floor(cycleMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pct = (cycleMs / YEAR_MS) * 100;

    return {
      hhmmss: `${pad2(h)}:${pad2(m)}:${pad2(s)}`,
      pct,
    };
  }, [now, epochMs]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "max(24px, 6vh) 24px",
      }}
    >
      <section
        style={{
          width: "min(640px, 92vw)",
          display: "grid",
          rowGap: 28,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.55 }}>System Running</div>

        <div
          style={{
            fontSize: "clamp(64px, 10vw, 92px)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {hhmmss}
        </div>

        <div style={{ fontSize: 16, opacity: 0.55 }}>
          {pct.toFixed(6)}% of 365-day cycle
        </div>
      </section>
    </main>
  );
}