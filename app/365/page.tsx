"use client";

import { useMemo, useState } from "react";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

function startOfTodayLocal(nowTs: number) {
  const d = new Date(nowTs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function sumAmounts(rs: Receipt[]) {
  let s = 0;
  for (const r of rs) s += r.amount;
  return s;
}

export default function Engine365() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  // inputs (empty by default)
  const [place, setPlace] = useState("");
  const [ts, setTs] = useState("");       // epoch ms string
  const [amount, setAmount] = useState(""); // money string

  const nowTs = Date.now();

  const { todaySpend, spend365 } = useMemo(() => {
    const today0 = startOfTodayLocal(nowTs);
    const cutoff365 = nowTs - 365 * 24 * 60 * 60 * 1000;

    const today = receipts.filter(r => r.ts >= today0 && r.ts <= nowTs);
    const rolling = receipts.filter(r => r.ts >= cutoff365 && r.ts <= nowTs);

    return {
      todaySpend: sumAmounts(today),
      spend365: sumAmounts(rolling),
    };
  }, [receipts, nowTs]);

  function addReceipt() {
    const p = place.trim();
    const t = Number(ts);
    const a = Number(amount);

    // minimal validation
    if (!p) return;
    if (!Number.isFinite(t) || t <= 0) return;
    if (!Number.isFinite(a) || a <= 0) return;

    const r: Receipt = {
      id: `${t}-${Math.random().toString(16).slice(2)}`,
      place: p,
      amount: a,
      ts: t,
    };

    setReceipts(prev => [r, ...prev]);

    // reset inputs (keep it fast for batching)
    setPlace("");
    setTs("");
    setAmount("");
  }

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
        {/* BIG number */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Today Spend</div>
          <div
            style={{
              fontSize: "clamp(52px, 7vw, 76px)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${todaySpend.toFixed(2)}
          </div>
        </div>

        {/* SMALL number */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>365 Spend</div>
          <div
            style={{
              fontSize: "clamp(40px, 5.5vw, 58px)",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${spend365.toFixed(2)}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: "grid", rowGap: 14, marginTop: 6 }}>
          <input
            placeholder="Place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Timestamp (epoch ms)"
            inputMode="numeric"
            value={ts}
            onChange={(e) => setTs(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />

          <button onClick={addReceipt} style={buttonStyle}>
            Add
          </button>

          {/* optional: tiny debug count */}
          <div style={{ fontSize: 12, opacity: 0.45 }}>
            Receipts: {receipts.length}
          </div>
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

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 14,
  color: "white",
  fontSize: 15,
  fontWeight: 600,
};
