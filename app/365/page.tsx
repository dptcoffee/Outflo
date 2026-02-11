"use client";

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

function formatLocal(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function Engine365() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  // inputs
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
      // ignore quota / storage failures for v1
    }
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

    setReceipts((prev) => [r, ...prev]);
    setPlace("");
    setAmount("");
  }

  function deleteReceipt(id: string) {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  }

  function clearAll() {
    setReceipts([]);
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
          rowGap: "clamp(22px, 4vh, 44px)",
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

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.45 }}>
              Receipts: {receipts.length}
            </div>
            <button onClick={clearAll} style={linkButtonStyle}>
              Clear
            </button>
          </div>
        </div>

        {/* Receipts list (read what you entered) */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.55 }}>Transactions</div>

          {receipts.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {receipts.slice(0, 25).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ opacity: 0.9 }}>{r.place}</div>
                    <div style={{ opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>
                      {formatLocal(r.ts)}
                    </div>
                  </div>

                  <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
                    <div style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatMoney(r.amount)}
                    </div>
                    <button onClick={() => deleteReceipt(r.id)} style={miniButtonStyle}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

const linkButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "white",
  opacity: 0.6,
  fontSize: 12,
  padding: 0,
  cursor: "pointer",
};

const miniButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  opacity: 0.75,
  fontSize: 11,
  borderRadius: 10,
  padding: "4px 8px",
  cursor: "pointer",
};


