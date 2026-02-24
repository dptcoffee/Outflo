/* ==========================================================
   OUTFLO — DAY RECEIPTS
   File: app/app/money/day/[key]/page.tsx
   Scope: Cloud-only day view (filter receipts by local day key)
   ========================================================== */

"use client";

/* ------------------------------
   Imports
-------------------------------- */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

/* ------------------------------
   Types
-------------------------------- */
type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms (truth)
};

/* ------------------------------
   API
-------------------------------- */
const API_RECEIPTS = "/api/receipts";

async function apiGetReceipts(): Promise<Receipt[]> {
  const res = await fetch(API_RECEIPTS, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) throw new Error(`GET /api/receipts failed (${res.status})`);

  const json = await res.json();
  const receipts = Array.isArray(json?.receipts) ? json.receipts : [];

  return receipts.filter(
    (t: any) =>
      t &&
      typeof t.id === "string" &&
      typeof t.place === "string" &&
      typeof t.amount === "number" &&
      typeof t.ts === "number"
  );
}

/* ------------------------------
   Format / Compute
-------------------------------- */
function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function receiptSuffix(id: string) {
  const parts = id.split("-");
  return parts.length > 1 ? parts[1] : id;
}

/* 24-hour European time (time only) */
function formatReceiptTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* Day header: 11 Feb 2026 */
function formatDayHeaderFromKey(key: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* Stable local day key */
function dayKeyLocal(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ------------------------------
   CSV
-------------------------------- */
function csvEscape(v: string) {
  if (v.includes('"')) v = v.replace(/"/g, '""');
  const needsQuotes =
    v.includes(",") || v.includes("\n") || v.includes("\r") || v.includes('"');
  return needsQuotes ? `"${v}"` : v;
}

function formatLocalDate(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatLocalTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

function receiptsToCsv(receipts: Receipt[]) {
  const header = ["ts", "localDate", "localTime", "place", "amount", "id"].join(
    ","
  );

  const rows = receipts.map((r) => {
    const fields = [
      String(r.ts),
      formatLocalDate(r.ts),
      formatLocalTime(r.ts),
      csvEscape(r.place),
      r.amount.toFixed(2),
      csvEscape(r.id),
    ];
    return fields.join(",");
  });

  return [header, ...rows].join("\r\n");
}

function downloadTextFile(filename: string, content: string, mime: string) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {}
}

/* ------------------------------
   Page
-------------------------------- */
export default function DayPage() {
  const params = useParams();
  const rawKey = (params as any)?.key;
  const key = decodeURIComponent(Array.isArray(rawKey) ? rawKey[0] : (rawKey ?? ""));

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
        // silent fail for sprint
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const dayReceipts = useMemo(() => {
    if (!key) return [];
    const filtered = receipts.filter((r) => dayKeyLocal(r.ts) === key);
    return filtered.sort((a, b) => b.ts - a.ts);
  }, [receipts, key]);

  const dayTotal = useMemo(() => {
    let s = 0;
    for (const r of dayReceipts) s += r.amount;
    return s;
  }, [dayReceipts]);

  const dayCumById = useMemo(() => {
    const out = new Map<string, number>();

    const asc = [...dayReceipts].sort((a, b) => {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return a.id.localeCompare(b.id);
    });

    let s = 0;
    for (const r of asc) {
      s += r.amount;
      out.set(r.id, s);
    }

    return out;
  }, [dayReceipts]);

  function exportDayCsv() {
    const sorted = [...dayReceipts].sort((a, b) => b.ts - a.ts);
    const csv = receiptsToCsv(sorted);
    downloadTextFile(
      `outflo_day_${key}_${Date.now()}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "max(24px, 6vh) 0px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "none",
          marginInline: "auto",
          display: "grid",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        {/* TOP ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <Link
            href="/app/money/receipts"
            style={{
              color: "white",
              opacity: 0.7,
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            ← Back
          </Link>

          <button onClick={exportDayCsv} style={pillButtonStyle}>
            Export CSV
          </button>
        </div>

        {/* HEADER */}
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Day</div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.6,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {formatDayHeaderFromKey(key)} · {formatMoney(dayTotal)}
          </div>

          <div style={{ fontSize: 12, opacity: 0.45 }}>
            Receipts:{" "}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? "…" : dayReceipts.length}
            </span>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>Loading…</div>
        ) : dayReceipts.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {dayReceipts.map((r) => {
              const cum = dayCumById.get(r.id);
              const cumText = formatMoney(typeof cum === "number" ? cum : r.amount);

              return (
                <Link
                  key={r.id}
                  href={`/app/money/receipts/${encodeURIComponent(r.id)}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 14, opacity: 0.9 }}>{r.place}</div>

                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.55,
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "0.02em",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                        title="Day cumulative at this moment"
                      >
                        {cumText}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatMoney(r.amount)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        fontSize: 12,
                        opacity: 0.55,
                      }}
                    >
                      <span>{formatReceiptTime(r.ts)}</span>

                      <span
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "0.05em",
                          opacity: 0.7,
                        }}
                      >
                        #{receiptSuffix(r.id)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ fontSize: 11, opacity: 0.22 }}>Stored in cloud.</div>
      </section>
    </main>
  );
}

/* ------------------------------
   Styles
-------------------------------- */
const pillButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};