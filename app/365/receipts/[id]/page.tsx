// app/365/receipts/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms (truth)
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";

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

function formatHeroWhen(ts: number) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
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

function sumDay(items: Receipt[]) {
  let s = 0;
  for (const r of items) s += r.amount;
  return s;
}

function dayCumulativeAtMoment(target: Receipt, receipts: Receipt[]) {
  const k = dayKeyLocal(target.ts);
  const sameDay = receipts.filter((r) => dayKeyLocal(r.ts) === k);

  const asc = [...sameDay].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id.localeCompare(b.id);
  });

  let s = 0;
  for (const r of asc) {
    s += r.amount;
    if (r.id === target.id) return s;
  }
  return target.amount;
}

export default function ReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();

  // IMPORTANT: client-safe param extraction (fixes mobile Safari / prod weirdness)
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : (raw ?? "");

  const [loaded, setLoaded] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    const primary = safeParseReceipts(localStorage.getItem(STORAGE_KEY));
    if (primary) {
      setReceipts(primary);
      setLoaded(true);
      return;
    }

    const backup = safeParseReceipts(localStorage.getItem(BACKUP_KEY));
    if (backup) {
      setReceipts(backup);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      } catch {}
      setLoaded(true);
      return;
    }

    setReceipts([]);
    setLoaded(true);
  }, []);

  const receipt = useMemo(() => {
    if (!id) return null;

    // Router often gives decoded values already; this covers both.
    const r =
      receipts.find((x) => x.id === id) ??
      receipts.find((x) => x.id === decodeURIComponent(id)) ??
      null;

    return r;
  }, [receipts, id]);

  const engine = useMemo(() => {
    if (!receipt) return null;

    const dayKey = dayKeyLocal(receipt.ts);
    const sameDay = receipts.filter((r) => dayKeyLocal(r.ts) === dayKey);

    const dayTotal = sumDay(sameDay);
    const dayCum = dayCumulativeAtMoment(receipt, receipts);

    const total365 = receipts.reduce((s, r) => s + r.amount, 0);

    const asc = [...sameDay].sort((a, b) => {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return a.id.localeCompare(b.id);
    });

    const idx = Math.max(0, asc.findIndex((r) => r.id === receipt.id));

    return {
      dayCum,
      dayTotal,
      total365,
      dayIndex: idx + 1,
      dayCount: asc.length,
    };
  }, [receipt, receipts]);

  function close() {
    try {
      router.back();
    } catch {
      router.push("/365/receipts");
    }
  }

  // LOADING GATE
  if (!loaded) {
    return (
      <main style={overlayWrap}>
        <div style={sheetStyle}>
          <button onClick={close} style={xStyle} aria-label="Close">
            ×
          </button>
          <div style={{ fontSize: 12, opacity: 0.55 }}>Loading…</div>
        </div>
      </main>
    );
  }

  // NOT FOUND (only after loaded)
  if (!receipt) {
    return (
      <main style={overlayWrap}>
        <div style={sheetStyle}>
          <button onClick={close} style={xStyle} aria-label="Close">
            ×
          </button>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 16, opacity: 0.9 }}>Receipt not found.</div>

            <div style={{ fontSize: 12, opacity: 0.55 }}>
              id:{" "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {id || "(empty)"}
              </span>
              {" · "}
              vault:{" "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {receipts.length}
              </span>
            </div>

            <button
              onClick={() => router.push("/365/receipts")}
              style={pillButtonStyle}
            >
              Back to receipts
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={overlayWrap}>
      <div style={sheetStyle}>
        <button onClick={close} style={xStyle} aria-label="Close">
          ×
        </button>

        {/* HERO */}
        <div style={{ display: "grid", gap: 10, paddingTop: 8 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          />

          <div style={{ display: "grid", gap: 4 }}>
            <div
              style={{ fontSize: 34, fontWeight: 650, letterSpacing: "-0.02em" }}
            >
              {receipt.place}
            </div>

            <div style={{ fontSize: 14, opacity: 0.55 }}>
              {formatHeroWhen(receipt.ts)}
            </div>
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              opacity: 0.65,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(receipt.amount)}
          </div>
        </div>

        <div style={divider} />

        {/* ENGINE / CONTEXT */}
        <div style={block}>
          <Row
            label="Day cumulative (at this moment)"
            value={formatMoney(engine!.dayCum)}
          />
          <Row label="365 rolling total" value={formatMoney(engine!.total365)} />
        </div>

        <div style={divider} />

        {/* LEDGER */}
        <div style={block}>
          <Row label="Receipt ID" value={`#${receipt.id}`} mono />
          <Row label="Epoch (ms)" value={String(receipt.ts)} mono />
          <Row
            label="Index in day"
            value={`${engine!.dayIndex} of ${engine!.dayCount}`}
            mono
          />
        </div>

        <div style={divider} />

        {/* EXPLORE / ACTIONS */}
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 650 }}>Explore</div>

          <Action label={`View all transactions from ${receipt.place}`} />
          <Action label="View full breakdown for this day" />
          <Action label={`See ${receipt.place} across 365 days`} />
          <Action label="Learn how the Engine works" />
          <Action label="View location details" />
        </div>

        <div style={divider} />

        {/* FOOTER */}
        <div style={{ fontSize: 13, opacity: 0.55, lineHeight: 1.45 }}>
          Outflō (placeholder)
          <br />
          Contact: (placeholder)
          <br />
          Support: (placeholder)
        </div>

        <div style={{ height: 18 }} />
      </div>
    </main>
  );
}

/* --- tiny UI helpers --- */

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "baseline",
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.55 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          opacity: 0.9,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          ...(mono ? { letterSpacing: "0.02em" } : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Action({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 16, opacity: 0.9 }}>{label}</div>
      <div style={{ fontSize: 22, opacity: 0.35 }}>›</div>
    </div>
  );
}

const overlayWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "rgba(0,0,0,0.92)",
  color: "white",
  display: "grid",
  placeItems: "start center",
  padding: "max(24px, 6vh) 24px",
};

const sheetStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 760,
  marginInline: "auto",
  boxSizing: "border-box",
  position: "relative",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.70)",
  padding: "18px 18px 22px",
};

const xStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  width: 44,
  height: 44,
  borderRadius: 999,
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 34,
  opacity: 0.8,
  cursor: "pointer",
  lineHeight: "44px",
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.10)",
  margin: "18px 0",
};

const block: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const pillButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  borderRadius: 999,
  padding: "10px 12px",
  fontSize: 12,
  cursor: "pointer",
};
