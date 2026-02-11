"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Receipt = {
  id: string;
  place: string;
  amount: number; // positive outflow
  ts: number;     // epoch ms (stamped by engine)
};

const STORAGE_KEY = "outflo_receipts_v1";

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

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function Engine365() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [place, setPlace] = useState("");
  const [amount, setAmount] = useState("");

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setReceipts(parsed);
    } catch {
      // ignore corrupt storage for v1
    }
  }, []);

  // save on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    } catch {
      // ignore quota issues for v1
    }
  }, [receipts]);

  const nowTs = Date.now();

  const { todaySpend, spend365 } = useMemo(() => {
    const today0 = startOfTodayLocal(nowTs);
    const cutoff365 = nowTs - 365 * 24 * 60 * 60 * 1000; // 31,536,000 seconds in ms

    const today = receipts.filter((r) => r.ts >= today0 && r.ts <= nowTs);
    const rolling = receipts.filter((r) => r.ts >= cutoff365 && r.ts <= nowTs);

    return {
      todaySpend: sumAmounts(today),
      spend365: sumAmounts(rolling),
    };
  }, [receipts, nowTs]);

  function addReceipt() {
    const p = place.trim();
    const a = Number(amount);

    if (!p) return;
    if (!Number.isFinite(a) || a <= 0) return;

    const t = Date.now();

    const r: Receipt = {
      id: `${t}-${Math.random().toString(16).slice(2)}`,
      place: p,
      amount: a,
      ts: t,
    };

    setReceipts((prev) => [r, ...prev]);
    setPlace("");
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
            {formatMoney(todaySpend)}
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
            {formatMoney(spend365)}
          </div>
        </div>

        {/* Receipts count + link */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            Receipts:{" "}
            <span style={{ opacity: 0.9, fontVariantNumeric: "tabular-nums" }}>
              {receipts.length}
            </span>
          </div>
          <Link href="/365/receipts" style={{ fontSize: 12, color: "white", opacity: 0.7, textDecoration: "none" }}>
            View receipts
          </Link>
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
            placeholder="Amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />

          <button onClick={addReceipt} style={buttonStyle}>
            Add
          </button>
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


