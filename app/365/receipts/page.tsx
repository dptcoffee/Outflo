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

function safeParseReceipts(raw: string | null): Receipt[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
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
  const [admin, setAdmin] = useState(false);
  const [tapCount, setTapCount] = useState(0);

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
      // restore primary if broken/missing
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      } catch {}
    }
  }, []);

  // Keep in sync if main page adds receipts (same tab)
  // (This page is read-only; it just re-reads storage on mount.
  // If you want live sync across tabs later, we can add the storage event.)
  const count = receipts.length;

  const sortedReceipts = useMemo(() => {
    // ensure newest-first even if storage gets weird
    return [...receipts].sort((a, b) => b.ts - a.ts);
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
    try {
      const payload = {
        exportedAt: Date.now(),
        version: 1,
        receipts: sortedReceipts,
      };
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
    } catch {
      // ignore
    }
  }

  function resetVault() {
    // Hard gate: must type exact phrase
    const phrase = window.prompt('Type exactly: RESET OUTFLO');
    if (phrase !== "RESET OUTFLO") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
    } catch {}

    setReceipts([]);
    setAdmin(false);
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <Link
            href="/365"
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
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={exportJson} style={pillButtonStyle}>
                Export
              </button>
              <button onClick={resetVault} style={dangerButtonStyle}>
                Reset Vault
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.35 }}>
              {/* no visible destructive controls */}
            </div>
          )}
        </div>

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
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
          </div>
        </div>

        {sortedReceipts.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.35 }}>No receipts yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {sortedReceipts.slice(0, 300).map((r) => (
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
                  <div
                    style={{
                      opacity: 0.55,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatLocal(r.ts)}
                  </div>
                </div>

                <div style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatMoney(r.amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11, opacity: 0.25, marginTop: 10 }}>
          {/* tiny footer hint without advertising admin mode */}
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
  background: "rgba(255,60,60,0.12)",
  border: "1px solid rgba(255,60,60,0.30)",
  color: "white",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};

