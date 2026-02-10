"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYearLocal(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  const ms = d.getTime() - start.getTime();
  return Math.floor(ms / 86400000) + 1; // 1-based
}

function timeOfDay(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export default function TimePage() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const out = useMemo(() => {
    const day = dayOfYearLocal(now);
    const daysInYear = isLeapYear(now.getFullYear()) ? 366 : 365;

    // % of year complete by fraction of the current day (smooth, seconds-based)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const secondsIntoToday = Math.floor((now.getTime() - startOfToday.getTime()) / 1000);
    const fracOfToday = secondsIntoToday / 86400; // 0..~1
    const percent = (((day - 1) + fracOfToday) / daysInYear) * 100;

    return {
      day,
      daysInYear,
      tod: timeOfDay(now),
      percent: percent.toFixed(2),
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
          rowGap: "clamp(24px, 4.5vh, 52px)",
        }}
      >
        {/* Row 1 — Position */}
        <div style={{ fontSize: 13, opacity: 0.55 }}>
          Day {out.day} of {out.daysInYear}
        </div>

        {/* Row 2 — Flow (main) */}
        <div
          style={{
            fontSize: "clamp(56px, 8vw, 86px)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 18px rgba(255,255,255,0.35)", // same glow language
          }}
        >
          {out.tod}
        </div>

        {/* Row 3 — Meaning */}
        <div style={{ fontSize: 15, opacity: 0.7 }}>
          {out.percent}% of year complete
        </div>
      </section>
    </main>
  );
}

