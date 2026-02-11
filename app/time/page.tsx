"use client";

import { useEffect, useMemo, useState } from "react";

const EPOCH_KEY = "outflo_epoch_startedAt_ms";
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function getOrCreateEpoch(): number {
  if (typeof window === "undefined") return Date.now();

  const existing = window.localStorage.getItem(EPOCH_KEY);
  if (existing) return Number(existing);

  const now = Date.now();
  window.localStorage.setItem(EPOCH_KEY, String(now));
  return now;
}

export default function TimePage() {
  const [tick, setTick] = useState(0);

  // Epoch is written once. Never overwritten.
  const startedAt = useMemo(() => getOrCreateEpoch(), []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const ageSeconds = Math.floor((now - startedAt) / 1000);

  // Percent of rolling 365 since activation
  const percent = Math.min(
    100,
    ((now - startedAt) / YEAR_MS) * 100
  ).toFixed(2);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "max(24px, 6vh) 24px",
        touchAction: "pan-y",
      }}
    >
      <section
        style={{
          width: "min(640px, 92vw)",
          display: "grid",
          rowGap: "clamp(24px, 4.5vh, 52px)",
        }}
      >
        {/* Row 1 — Position */}
        <div style={{ fontSize: 13, opacity: 0.55 }}>
          System Running
        </div>

        {/* Row 2 — Flow (main) */}
        <div
          style={{
            fontSize: "clamp(56px, 8vw, 86px)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 18px rgba(255,255,255,0.35)",
          }}
        >
          {formatHMS(ageSeconds)}
        </div>

        {/* Row 3 — Meaning */}
        <div style={{ fontSize: 15, opacity: 0.7 }}>
          {percent}% of 365-day cycle
        </div>
      </section>
    </main>
  );
}


