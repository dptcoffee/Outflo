"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms (truth)
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";
const LAST_EXPORT_KEY = "outflo_last_export_v1";

function safeParseReceipts(raw: string | null): Receipt[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const cleaned = parsed.filter(
      (t: any) =>
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

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
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
function formatDayHeader(ts: number) {
  const d = new Date(ts);
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

function receiptSuffix(id: string) {
  const parts = id.split("-");
  return parts.length > 1 ? parts[1] : id;
}

function sumDay(items: Receipt[]) {
  let s = 0;
  for (const r of items) s += r.amount;
  return s;
}

function hardResetOutfloZeroStart() {
  // wipe everything we’ve created during this build
  const KEYS = [
    // receipts vault
    "outflo_receipts_v1",
    "outflo_receipts_v1_backup",

    // system clock epoch (Time page)
    "outflo_system_epoch_v1",

    // any earlier home/app anchors used in iterations
    "outflo_app_epoch_start_v1",
    "outflo_epoch_start_v1",
    "outflo_app_epoch_v1",
    "outflo_epoch_start",
    "outflo_epoch_v1",

    // export cache
    "outflo_last_export_v1",
  ];

  try {
    for (const k of KEYS) localStorage.removeItem(k);
  } catch {}
}

export default function ReceiptsPage() {
  const router = useRouter();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [admin, setAdmin] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  // Load primary -> backup fallback
  useEffect(() => {
    const primary = safeParseReceipts(localStorage.getItem(STORAGE_KEY));
    if (primary) {
      setReceipts(primary);
      return;
    }

    const backup = safeParseReceipts(localStorage.getItem(BACKUP_KEY));
    if (backup) {
      setReceipts(backup);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      } catch {}
    }
  }, []);

  const sortedLimited = useMemo(() => {
    const sorted = [...receipts].sort((a, b) => b.ts - a.ts);
    return sorted.slice(0, 300);
  }, [receipts]);

  const grouped = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Receipt[]>();

    for (const r of sortedLimited) {
      const key = dayKeyLocal(r.ts);
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(r);
    }

    return { order, map };
  }, [sortedLimited]);

  // Per-receipt "day cumulative at that moment" (computed chronologically, rendered newest-first)
  const dayCumById = useMemo(() => {
    const out = new Map<string, number>();

    const byDay = new Map<string, Receipt[]>();
    for (const r of receipts) {
      const k = dayKeyLocal(r.ts);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(r);
    }

    for (const [, items] of byDay) {
      const asc = [...items].sort((a, b) => {
        if (a.ts !== b.ts) return a.ts - b.ts;
        return a.id.localeCompare(b.id); // deterministic for ts collisions
      });

      let s = 0;
      for (const r of asc) {
        s += r.amount;
        out.set(r.id, s);
      }
    }

    return out;
  }, [receipts]);

  function unlockAdmin() {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 7) {
      setAdmin(true);
      setTapCount(0);
    }
  }

  function exportJson() {
    const payload = {
      exportedAt: Date.now(),
      version: 1,
      receipts: [...receipts].sort((a, b) => b.ts - a.ts), // full vault
    };

    // 1) Save last export for instant viewing
    try {
      localStorage.setItem(LAST_EXPORT_KEY, JSON.stringify(payload));
    } catch {}

    // 2) Download file
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `outflo_receipts_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}

    // 3) Auto-open viewer
    router.push("/365/export");
  }

  function resetVault() {
    const phrase = window.prompt('Type exactly: RESET OUTFLO');
    if (phrase !== "RESET OUTFLO") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
    } catch {}

    setReceipts([]);
    setAdmin(false);
  }

  function hardResetZeroStart() {
    const phrase = window.prompt("Type exactly: ZERO OUTFLO");
    if (phrase !== "ZERO OUTFLO") return;

    hardResetOutfloZeroStart();
    // hard start
    location.href = "/";
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
      {/* Centering fix: remove vw width math; rely on maxWidth + margin auto */}
      <section
        style={{
          width: "100%",
          maxWidth: 820,
          marginInline: "auto",
          display: "grid",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <Link
            href="/365/money"
            style={{
              color: "white",
              opacity: 0.7,
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            ← Back
          </Link>

          {admin ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={exportJson} style={pillButtonStyle}>
                Export
              </button>
              <button onClick={resetVault} style={pillButtonStyle}>
                Soft Reset
              </button>
              {/* Hard Reset removed from this page (moved to Export page) */}
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.35 }} />
          )}
        </div>

        {/* Header */}
        <div style={{ display: "grid", gap: 6 }}>
          <div
            onClick={unlockAdmin}
            style={{
              fontSize: 13,
              opacity: 0.85,
              userSelect: "none",
              cursor: "default",
            }}
            title="(tap 7x)"
          >
            Receipts
          </div>

          <div style={{ fontSize: 12, opacity: 0.45 }}>
            Total:{" "}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {receipts.length}
            </span>
            <span style={{ opacity: 0.35 }}>
              {" "}
              · showing latest {sortedLimited.length}
            </span>
          </div>
        </div>

        {/* Grouped by day */}
        {sortedLimited.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {grouped.order.map((key) => {
              const items = grouped.map.get(key)!;
              const header = formatDayHeader(items[0].ts);
              const dayTotal = sumDay(items);

              return (
                <div key={key} style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.6,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {header} · {formatMoney(dayTotal)}
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {items.map((r) => {
                      const cum = dayCumById.get(r.id);
                      const cumText = formatMoney(
                        typeof cum === "number" ? cum : r.amount
                      );

                      return (
                        <div
                          key={r.id}
                          style={{
                            padding: "16px",
                            borderRadius: 18,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.03)",
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          {/* Tile top row: merchant left, day-cumulative snapshot right */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              gap: 12,
                            }}
                          >
                            <div style={{ fontSize: 14, opacity: 0.9 }}>
                              {r.place}
                            </div>

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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ fontSize: 11, opacity: 0.22 }}>
          Stored locally. Export recommended.
        </div>
      </section>
    </main>
  );
}

const pillButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  background: "rgba(255,60,60,0.14)",
  border: "1px solid rgba(255,60,60,0.35)",
  color: "white",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};






