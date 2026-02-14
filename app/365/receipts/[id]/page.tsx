// app/365/receipts/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";

// placeholders (fine for now)
const HERO_CITY_STATE = "Miami, FL";
const PLACEHOLDER_STREET = "123 Placeholder St";
const PLACEHOLDER_CITY_STATE_ZIP = "Miami, FL 33101";
const PLACEHOLDER_LAT = "25.7617";
const PLACEHOLDER_LNG = "-80.1918";
const PLACEHOLDER_PAYMENT = "Cash App";

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

function formatHeroTimestamp(ts: number) {
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

function formatFullTimestamp(ts: number) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}

function dayKeyLocal(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monogram(place: string) {
  const s = (place || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[1][0] : "";
  const raw = (first + second).toUpperCase();

  // If starts with a digit (e.g., "7-11"), keep just the digit.
  if (/\d/.test(first)) return first;
  return raw.slice(0, 2);
}

function sum365At(receipts: Receipt[], atTs: number) {
  const windowMs = 365 * 24 * 60 * 60 * 1000;
  const start = atTs - windowMs;
  let s = 0;
  for (const r of receipts) {
    if (r.ts >= start && r.ts <= atTs) s += r.amount;
  }
  return s;
}

export default function ReceiptDetailOverlay({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const primary = safeParseReceipts(localStorage.getItem(STORAGE_KEY));
    if (primary) {
      setReceipts(primary);
      setLoading(false);
      return;
    }

    const backup = safeParseReceipts(localStorage.getItem(BACKUP_KEY));
    if (backup) {
      setReceipts(backup);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      } catch {}
    }
    setLoading(false);
  }, []);

  const receipt = useMemo(() => receipts.find((r) => r.id === id) ?? null, [
    receipts,
    id,
  ]);

  const position = useMemo(() => {
    if (!receipt) return null;

    const key = dayKeyLocal(receipt.ts);
    const sameDay = receipts.filter((r) => dayKeyLocal(r.ts) === key);

    const asc = [...sameDay].sort((a, b) => {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return a.id.localeCompare(b.id);
    });

    let dayCum = 0;
    let idx = -1;
    for (let i = 0; i < asc.length; i++) {
      dayCum += asc[i].amount;
      if (asc[i].id === receipt.id) idx = i;
    }

    const indexInDay = idx >= 0 ? idx + 1 : 1;
    const countInDay = asc.length || 1;

    const total365 = sum365At(receipts, receipt.ts);

    return { dayCum, total365, indexInDay, countInDay };
  }, [receipts, receipt]);

  function close() {
    // feel like a layer: close goes "back"
    // fallback for deep links / no history
    try {
      if (window.history.length <= 1) {
        router.push("/365/receipts");
        return;
      }
    } catch {}
    router.back();
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "black",
        color: "white",
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: "max(24px, 5vh) 18px",
        animation: "outfloSlideUp 180ms ease-out both",
        overflowY: "auto",
      }}
    >
      <style jsx>{`
        @keyframes outfloSlideUp {
          from {
            transform: translateY(22px);
            opacity: 0.0;
          }
          to {
            transform: translateY(0px);
            opacity: 1;
          }
        }
      `}</style>

      <section style={{ width: "min(760px, 94vw)", display: "grid", gap: 16 }}>
        {/* top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <button
            onClick={close}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              opacity: 0.8,
              fontSize: 18,
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <div style={{ fontSize: 12, opacity: 0.35 }} />
        </div>

        {/* content */}
        {loading ? (
          <div style={{ fontSize: 12, opacity: 0.4 }}>Loading…</div>
        ) : !receipt || !position ? (
          <div style={{ fontSize: 12, opacity: 0.5 }}>
            Receipt not found.
          </div>
        ) : (
          <>
            {/* HERO */}
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  userSelect: "none",
                }}
                title="Merchant"
              >
                {monogram(receipt.place)}
              </div>

              <div style={{ fontSize: 18, fontWeight: 650, opacity: 0.95 }}>
                {receipt.place}
              </div>

              <div style={{ fontSize: 12, opacity: 0.55 }}>
                {HERO_CITY_STATE}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {formatHeroTimestamp(receipt.ts)}
              </div>

              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  marginTop: 2,
                }}
              >
                {formatMoney(receipt.amount)}
              </div>
            </div>

            <Divider />

            {/* POSITION */}
            <SectionTitle title="Position" />

            <KeyValueRow
              k="Day cumulative"
              v={formatMoney(position.dayCum)}
            />
            <KeyValueRow
              k="365 rolling total"
              v={formatMoney(position.total365)}
            />
            <KeyValueRow
              k="Index in day"
              v={`${position.indexInDay} of ${position.countInDay}`}
            />
            <KeyValueRow k="Street" v={PLACEHOLDER_STREET} />
            <KeyValueRow k="City" v={PLACEHOLDER_CITY_STATE_ZIP} />

            <Divider />

            {/* LEDGER */}
            <SectionTitle title="Ledger" />

            <KeyValueRow k="Receipt ID" v={receipt.id} />
            <KeyValueRow k="Timestamp" v={formatFullTimestamp(receipt.ts)} />
            <KeyValueRow k="Epoch (ms)" v={String(receipt.ts)} />
            <KeyValueRow k="Lat / Long" v={`${PLACEHOLDER_LAT}, ${PLACEHOLDER_LNG}`} />
            <KeyValueRow k="Payment method" v={PLACEHOLDER_PAYMENT} />

            <Divider />

            {/* EXPLORE */}
            <SectionTitle title="Explore" />

            <MenuItem label="See all your transactions for this day" onClick={() => alert("TBD")} />
            <MenuItem label="View this merchant across 365 days" onClick={() => alert("TBD")} />
            <MenuItem label="Contact this merchant" onClick={() => alert("TBD")} />
            <MenuItem label="Learn how the Engine works" onClick={() => alert("TBD")} />

            <div style={{ height: 6 }} />

            {/* Institutional footer */}
            <div style={{ fontSize: 11, opacity: 0.22, lineHeight: 1.45 }}>
              Outflō
              <br />
              100 Outflō Way
              <br />
              Miami, FL 33101
              <br />
              (000) 000-0000
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.10)",
        width: "100%",
      }}
    />
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        opacity: 0.65,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginTop: 2,
      }}
    >
      {title}
    </div>
  );
}

function KeyValueRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        alignItems: "baseline",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.75 }}>{k}</div>
      <div
        style={{
          fontSize: 13,
          opacity: 0.9,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          wordBreak: "break-word",
        }}
      >
        {v}
      </div>
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        color: "white",
        padding: "12px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14, opacity: 0.92 }}>{label}</span>
      <span style={{ fontSize: 18, opacity: 0.35, lineHeight: 1 }}>›</span>
    </button>
  );
}
