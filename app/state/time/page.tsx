"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeOfDay(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatHoursHMS(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const rem = totalSeconds % 3600;
  const minutes = Math.floor(rem / 60);
  const seconds = rem % 60;

  const hoursStr = hours.toLocaleString("en-US"); // commas
  return `${hoursStr}:${pad2(minutes)}:${pad2(seconds)}`;
}

function dayOfYearLocal(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1); // Jan 1, local
  const ms = d.getTime() - start.getTime();
  return Math.floor(ms / 86400000) + 1; // 1-based
}

export default function TimePage() {
  // ticking "now" so seconds roll
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const out = useMemo(() => {
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const yearElapsedSeconds = Math.floor((now.getTime() - startOfYear.getTime()) / 1000);

    return {
      day: dayOfYearLocal(now),
      timeOfDay: formatTimeOfDay(now),
      yearHMS: formatHoursHMS(yearElapsedSeconds),
    };
  }, [now]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        gridTemplateRows: "1fr auto 2fr",
        placeItems: "center",
        padding: "max(24px, 6vh) 24px",
      }}
    >
      <section
        style={{
          width: "min(640px, 92vw)",
          display: "grid",
          rowGap: "clamp(44px, 7vh, 72px)",
        }}
      >
        {/* Number 1 */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Today (Day · Time)</div>
          <div
            style={{
              fontSize: "clamp(44px, 6.2vw, 68px)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Day {out.day} · {out.timeOfDay}
          </div>
        </div>

        {/* Number 2 */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Year (Hours:MM:SS)</div>
          <div
            style={{
              fontSize: "clamp(40px, 5.5vw, 58px)",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {out.yearHMS}
          </div>
        </div>
      </section>
    </main>
  );
}
