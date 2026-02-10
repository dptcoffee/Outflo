"use client";

import { useMemo, useState } from "react";

export default function State() {
  const [budget, setBudget] = useState<string>("20");
  const [spent, setSpent] = useState<string>("13");

  const { gain, rolling365 } = useMemo(() => {
    const b = Number(budget) || 0;
    const s = Number(spent) || 0;

    const gainVal = b - s;
    return {
      gain: gainVal,
      rolling365: gainVal * 365,
    };
  }, [budget, spent]);

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
          rowGap: "clamp(28px, 5vh, 56px)",
        }}
      >
        {/* Numbers */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Today’s Gain</div>
          <div
            style={{
              fontSize: "clamp(52px, 7vw, 76px)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(gain >= 0 ? "+" : "-") + "$" + Math.abs(gain).toFixed(2)}
          </div>
        </div>

        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>365 Projection</div>
          <div
            style={{
              fontSize: "clamp(40px, 5.5vw, 58px)",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {"$" + rolling365.toFixed(2)}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: "grid", rowGap: 12, marginTop: 10 }}>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="Daily Budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              outline: "none",
              fontSize: 16,
            }}
          />
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="Amount Spent Today"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              outline: "none",
              fontSize: 16,
            }}
          />
        </div>
      </section>
    </main>
  );
}
