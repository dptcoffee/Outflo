"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

type ExportPayloadV1 = {
  exportedAt: number;
  version: number;
  receipts: Receipt[];
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function formatClock(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}:${pad3(d.getMilliseconds())}`;
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatReceiptTime(ts: number) {
  const d = new Date(ts);

  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${date} · ${time}`;
}

function safeParseExport(raw: string): ExportPayloadV1 | null {
  try {
    const p = JSON.parse(raw);

    if (!p || typeof p !== "object") return null;
    if (typeof p.version !== "number") return null;
    if (!Array.isArray(p.receipts)) return null;

    const receipts: Receipt[] = p.receipts
      .filter((r: any) =>
        r &&
        typeof r.id === "string" &&
        typeof r.place === "string" &&
        typeof r.amount === "number" &&
        typeof r.ts === "number"
      )
      .map((r: any) => ({
        id: r.id,
        place: r.place,
        amount: r.amount,
        ts: r.ts,
      }));

    return {
      exportedAt: typeof p.exportedAt === "number" ? p.exportedAt : Date.now(),
      version: p.version,
      receipts,
    };
  } catch {
    return null;
  }
}

export default function ExportViewerPage() {
  const [clockTs, setClockTs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClockTs(Date.now()), 50);
    return () => window.clearInterval(id);
  }, []);

  const [payload, setPayload] = useState<ExportPayloadV1 | null>(null);
  const [error, setError] = useState<string>("");

  // admin unlock for restore (tap title 7x)
  const [admin, setAdmin] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const sortedReceipts = useMemo(() => {
    if (!payload) return [];
    return [...payload.receipts].sort((a, b) => b.ts - a.ts);
  }, [payload]);

  function unlockAdmin() {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 7) {
      setAdmin(true);
      setTapCount(0);
    }
  }

  async function onPickFile(file: File | null) {
    setError("");
    setPayload(null);

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = safeParseExport(text);
      if (!parsed) {
        setError("Could not read this export file.");
        return;
      }
      setPayload(parsed);
    } catch {
      setError("Could not read this export file.");
    }
  }

  function restoreToVault() {
    if (!payload) return;

    const phrase = window.prompt('Type exactly: RESTORE OUTFLO');
    if (phrase !== "RESTORE OUTFLO") return;

    try {
      const s = JSON.stringify(payload.receipts);
      localStorage.setItem(STORAGE_KEY, s);
      localStorage.setItem(BACKUP_KEY, s);
      alert("Restored to vault.");
    } catch {
      alert("Restore failed.");
    }
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
      <section style={{ width: "min(760px, 94vw)", display: "grid", gap: 16 }}>
        {/* top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <Link
            href="/365/receipts"
            style={{
              color: "white",
              opacity: 0.7,
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            ← Back
          </Link>

          <div style={{ fontSize: 12, opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>
            {formatClock(clockTs)}
          </div>
        </div>

        {/* title + optional restore */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
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
            Export Viewer
          </div>

          {admin && payload ? (
            <button onClick={restoreToVault} style={dangerButtonStyle}>
              Restore
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* file input */}
        <div style={{ display: "grid", gap: 10 }}>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            style={fileStyle}
          />
          {error ? <div style={{ fontSize: 12, opacity: 0.6 }}>{error}</div> : null}
        </div>

        {/* render */}
        {payload ? (
          <>
            <div style={{ fontSize: 12, opacity: 0.45 }}>
              Loaded:{" "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {sortedReceipts.length}
              </span>{" "}
              receipts
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {sortedReceipts.map((r) => (
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
                  <div style={{ fontSize: 14, opacity: 0.9 }}>{r.place}</div>

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

                  <div style={{ fontSize: 12, opacity: 0.55 }}>
                    {formatReceiptTime(r.ts)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.35 }}>
            Choose an export file to view receipts.
          </div>
        )}
      </section>
    </main>
  );
}

const fileStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 12px",
  background: "#111",
  border: "1px solid #222",
  borderRadius: 14,
  color: "white",
  fontSize: 14,
  outline: "none",
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
