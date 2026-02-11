"use client";

import { useState } from "react";

export default function Merchant365() {
  const [visitsPerWeek, setVisitsPerWeek] = useState<number>(0);
  const [costPerVisit, setCostPerVisit] = useState<number>(0);

  // Core engine
  const dailyRate = (visitsPerWeek / 7) * costPerVisit;
  const merchant365 = dailyRate * 365;

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
          rowGap: "clamp(44px, 7vh, 72px)",
        }}
      >
        {/* Big Number */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>
            Merchant 365
          </div>
          <div
            style={{
              fontSize: "clamp(52px, 7vw, 76px)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${merchant365.toFixed(2)}
          </div>
        </div>

        {/* Secondary Number */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>
            Daily Rate
          </div>
          <div
            style={{
              fontSize: "clamp(40px, 5.5vw, 58px)",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${dailyRate.toFixed(2)}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: "grid", rowGap: 14 }}>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Visits per week"
            value={visitsPerWeek || ""}
            onChange={(e) => setVisitsPerWeek(Number(e.target.value))}
            style={inputStyle}
          />

          <input
            type="number"
            inputMode="decimal"
            placeholder="$ per visit"
            value={costPerVisit || ""}
            onChange={(e) => setCostPerVisit(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  background: "#111",
  border: "1px solid #222",
  borderRadius: 14,
  color: "white",
  fontSize: 16,
  outline: "none",
};
