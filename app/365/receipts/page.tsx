"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

const STORAGE_KEY = "outflo_receipts_v1";

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

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setReceipts(parsed);
    } catch {
      // ignore
    }
  }, []);

  // save on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    } catch {
      // ignore
    }
  }, [receipts]);

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
      <section style={{ width: "min(760px, 94vw)", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <Link href="/365" style={{ color: "white", opacity: 0.7, textDecoration: "none", fontSize: 12 }}>
            ← Back
          </Link>
          <button onClick={clearAll} style={linkButtonStyle}>
            Clear
          </button>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Receipts</div>
          <div style={{ fontSize: 12, opacity: 0.45 }}>Total: {receipts.length}</div>
        </div>

        {receipts.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {receipts.slice(0, 200).map((r) => (
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
      </section>
    </main>
  );
}

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
