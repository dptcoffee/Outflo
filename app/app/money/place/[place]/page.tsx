/* ==========================================================
   OUTFLO — MERCHANT RECEIPTS
   File: app/app/money/place/[place]/page.tsx
   Scope: Show all receipts for a given merchant (cloud truth)
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

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDay(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
export default function PlaceReceiptsPage() {
  const params = useParams();
  const raw = params?.place;
  const placeParam = Array.isArray(raw) ? raw[0] : (raw ?? "");
  const place = decodeURIComponent(placeParam);

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
    const norm = place.trim().toLowerCase();
    const filtered = receipts.filter((r) => (r.place || "").trim().toLowerCase() === norm);
    return filtered.sort((a, b) => b.ts - a.ts);
  }, [receipts, place]);

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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Link
            href="/app/money/receipts"
            style={{ color: "white", opacity: 0.7, textDecoration: "none", fontSize: 12 }}
          >
            ← Back
          </Link>

          <div style={{ fontSize: 12, opacity: 0.55, textAlign: "right" }}>
            {place} · {formatMoney(total)}
          </div>
        </div>

        {loading ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts for this merchant.</div>
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
                  <div style={{ fontSize: 12, opacity: 0.55 }}>{formatDay(r.ts)}</div>

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