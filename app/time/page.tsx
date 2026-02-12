"use client";

import { useEffect, useMemo, useState } from "react";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const EPOCH_KEY = "outflo_system_epoch_v1"; // keep stable

function getOrCreateEpoch(): number {
  try {
    const raw = localStorage.getItem(EPOCH_KEY);
    const n = raw ? Number(raw) : NaN;
    if (Number.isFinite(n) && n > 0) return n;

    const now = Date.now();
    localStorage.setItem(EPOCH_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function TimePage() {
  const [now, setNow] = useState(() => Date.now());
  const [epoch, setEpoch] = useState<number | null>(null);

  useEffect(() => {
    setEpoch(getOrCreateEpoch());

    // Update often so the % “moves” smoothly
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  const { hhmmss, pct } = useMemo(() => {
    if (epoch == null) return { hhmmss: "00:00:00", pct: 0 };

    const elapsed = now - epoch;
    const cycleMs = ((elapsed % YEAR_MS) + YEAR_MS) % YEAR_MS;

    const totalSeconds = Math.floor(cycleMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pct = (cycleMs / YEAR_MS) * 100;

    return {
      hhmmss: `${pad2(h)}:${pad2(m)}:${pad2(s)}`,
      pct,
    };
  }, [now, epoch]);

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
      <section style={{ width: "min(640px, 92vw)", display: "grid", rowGap: 28 }}>
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



