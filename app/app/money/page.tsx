"use client";

/* ------------------------------
   IMPORTS
-------------------------------- */
import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------
   TYPES
-------------------------------- */
type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

/* ------------------------------
   STORAGE
-------------------------------- */
// Cloud source of truth
const API_RECEIPTS = "/api/receipts";

/* ------------------------------
   COMPUTE
-------------------------------- */
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

/* ------------------------------
   API
-------------------------------- */
async function apiGetReceipts(): Promise<Receipt[]> {
  const res = await fetch(API_RECEIPTS, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) throw new Error(`GET /api/receipts failed (${res.status})`);

  const json = await res.json();
  const receipts = Array.isArray(json?.receipts) ? json.receipts : [];

  // minimal shape filter
  return receipts.filter(
    (t: any) =>
      t &&
      typeof t.id === "string" &&
      typeof t.place === "string" &&
      typeof t.amount === "number" &&
      typeof t.ts === "number"
  );
}

async function apiPostReceipt(input: {
  place: string;
  amount: number;
  ts: number;
}): Promise<Receipt> {
  const res = await fetch(API_RECEIPTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(`POST /api/receipts failed (${res.status})`);

  const json = await res.json();
  const r = json?.receipt;

  if (
    !r ||
    typeof r.id !== "string" ||
    typeof r.place !== "string" ||
    typeof r.amount !== "number" ||
    typeof r.ts !== "number"
  ) {
    throw new Error("Invalid receipt response");
  }

  return r as Receipt;
}

/* ------------------------------
   PAGE
-------------------------------- */
export default function MoneyPage() {
  /* ------------------------------
     STATE
  -------------------------------- */
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [place, setPlace] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);

  /* ------------------------------
     EFFECTS
  -------------------------------- */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rs = await apiGetReceipts();
        if (!alive) return;
        setReceipts(rs);
      } catch {
        // silent fail = non-blocking
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ------------------------------
     COMPUTE
  -------------------------------- */
  // NOTE: this will be stabilized in Priority #3 (clock jitter).
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

  /* ------------------------------
     HANDLERS
  -------------------------------- */
  async function addReceipt() {
    const p = place.trim();
    const a = Number(amount);

    if (!p) return;
    if (!Number.isFinite(a) || a <= 0) return;

    const t = Date.now();

    try {
      const created = await apiPostReceipt({ place: p, amount: a, ts: t });
      // append-only behavior, cloud-confirmed
      setReceipts((prev) => [created, ...prev]);
      setPlace("");
      setAmount("");
    } catch {
      // silent fail for sprint (no UI sprawl)
    }
  }

  /* ------------------------------
     RENDER
  -------------------------------- */
  return (
    <div
      style={{
        minHeight: "100svh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "max(24px, 6vh) 0px", // vertical only; global frame owns horizontal
        width: "100%",
      }}
    >
      <section
        style={{
          width: "100%", // obey global 520 frame
          display: "grid",
          rowGap: "clamp(28px, 5vh, 56px)",
          boxSizing: "border-box",
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

          <button onClick={addReceipt} style={buttonStyle} disabled={loading}>
            Add
          </button>

          {/* Receipts Count (Left Aligned, Bold Number) */}
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            <Link
              href="/app/money/receipts"
              style={{ textDecoration: "none", color: "white" }}
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
    </div>
  );
}

/* ------------------------------
   STYLES
-------------------------------- */
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