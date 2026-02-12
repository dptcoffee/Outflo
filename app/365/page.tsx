"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";

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

function safeParseReceipts(raw: string | null): Receipt[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // minimal shape check
    const cleaned = parsed.filter((t: any) =>
      t &&
      typeof t.id === "string" &&
      typeof t.place === "string" &&
      typeof t.amount === "number" &&
      typeof t.ts === "number"
    );
    return cleaned;
  } catch {
    return null;
  }
}

export default function Engine365() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [place, setPlace] = useState("");
  const [amount, setAmount] = useState("");

  // Load: primary -> backup fallback
  useEffect(() => {
    const primary = safeParseReceipts(localStorage.getItem(STORAGE_KEY));
    if (primary) {
      setReceipts(primary);
      return;
    }
    const backup = safeParseReceipts(localStorage.getItem(BACKUP_KEY));
    if (backup) {
      setReceipts(backup);
      // restore primary if it was broken/missing
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      } catch {}
    }
  }, []);

  // Save: primary + backup (vault hardening)
  useEffect(() => {
    try {
      const s = JSON.stringify(receipts);
      localStorage.setItem(STORAGE_KEY, s);
      localStorage.setItem(BACKUP_KEY, s);
    } catch {}
  }, [receipts]);

  const nowTs = Date.now();

  const { todaySpend, spend365 } = useMemo(() => {
    const today0 = startOfTodayLocal(nowTs);
    const cutoff365 = nowTs - 365 * 24 * 60 * 60 * 1000;

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

    // append-only vault behavior
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
        {/* Today Spend */}
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

        {/* 365 Spend */}
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

        {/* Inputs */}
        <div style={{ display: "grid", rowGap: 14 }}>
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

          {/* Receipts Count (Left Aligned, Bold Number) */}
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            <Link
              href="/365/receipts"
              style={{
                textDecoration: "none",
                color: "white",
              }}
            >
              Receipts:{" "}
              <span
                style={{
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {receipts.length}
              </span>
            </Link>
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




