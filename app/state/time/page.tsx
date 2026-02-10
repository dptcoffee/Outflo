"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function TimePage() {
  // tick once per second
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { dayOfYear, hmsElapsed, percentYear } = useMemo(() => {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const msElapsed = now.getTime() - startOfYear.getTime();

    const secondsElapsed = Math.floor(msElapsed / 1000);

    const hours = Math.floor(secondsElapsed / 3600);
    const minutes = Math.floor((secondsElapsed % 3600) / 60);
    const seconds = secondsElapsed % 60;

    const dayOfYear =
      Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1;

    const isLeap =
      new Date(now.getFullYear(), 1, 29).getMonth() === 1;
    const daysInYear = isLeap ? 366 : 365;

    const percentYear = (dayOfYear / daysInYear) * 100;

    return {
      dayOfYear,
      hmsElapsed: `${hours.toLocaleString()}:${pad(minutes)}:${pad(seconds)}`,
      percentYear: percentYear.toFixed(2),
    };
  }, [now]);

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
          rowGap: "clamp(28px, 5vh, 56px)",
        }}
      >
        {/* Row 1 — Position */}
        <div style={{ fontSize: 13, opacity: 0.55 }}>
          Day {dayOfYear} of 365
        </div>

        {/* Row 2 — Flow */}
        <div
          style={{
            fontSize: "clamp(44px, 7vw, 72px)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 18px rgba(255,255,255,0.35)",
          }}
        >
          {hmsElapsed}
        </div>

        {/* Row 3 — Meaning */}
        <div style={{ fontSize: 15, opacity: 0.7 }}>
          {percentYear}% of year complete
        </div>
      </section>
    </main>
  );
}
