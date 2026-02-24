/* ==========================================================
   OUTFLO — DAY RECEIPTS
   File: app/app/money/day/[day]/page.tsx
   Scope: Show all receipts for a given local day (cloud truth)
   ========================================================== */

"use client";

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/* ------------------------------
   Types
-------------------------------- */
type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number;
};

/* ------------------------------
   Constants
-------------------------------- */
const API_RECEIPTS = "/api/receipts";

/* ------------------------------
   Helpers
-------------------------------- */
function isReceipt(x: any): x is Receipt {
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.place === "string" &&
    typeof x.amount === "number" &&
    typeof x.ts === "number"
  );
}

function dayKeyLocal(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatReceiptTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function sumAmounts(rs: Receipt[]) {
  let s = 0;
  for (const r of rs) s += r.amount;
  return s;
}

async function apiGetReceipts(): Promise<Receipt[]> {
  const res = await fetch(API_RECEIPTS, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) throw new Error(`GET /api/receipts failed (${res.status})`);

  const json = await res.json();
  const receipts = Array.isArray(json?.receipts) ? json.receipts : [];
  return receipts.filter(isReceipt);
}

/* ------------------------------
   Component
-------------------------------- */
export default function DayReceiptsPage() {
  const params = useParams();
  const raw = params?.day;
  const day = Array.isArray(raw) ? raw[0] : (raw ?? "");
  const dayKey = decodeURIComponent(day);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rs = await apiGetReceipts();
        if (!alive) return;
        setReceipts(rs);
      } catch {
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(() => {
    const filtered = receipts.filter((r) => dayKeyLocal(r.ts) === dayKey);
    return filtered.sort((a, b) => b.ts - a.ts);
  }, [receipts, dayKey]);

  const total = useMemo(() => sumAmounts(items), [items]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        display: "grid",
        placeItems: "start center",
        padding: "max(24px, 6vh) 0px",
        width: "100%",
      }}
    >
      <section style={{ width: "100%", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Link
            href="/app/money/receipts"
            style={{ color: "white", opacity: 0.7, textDecoration: "none", fontSize: 12 }}
          >
            ← Back
          </Link>

          <div style={{ fontSize: 12, opacity: 0.55 }}>
            {dayKey} · {formatMoney(total)}
          </div>
        </div>

        {loading ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts for this day.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((r) => (
              <Link
                key={r.id}
                href={`/app/money/receipts/${encodeURIComponent(r.id)}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>{r.place}</div>
                    <div style={{ fontSize: 12, opacity: 0.55 }}>{formatReceiptTime(r.ts)}</div>
                  </div>

                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(r.amount)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}