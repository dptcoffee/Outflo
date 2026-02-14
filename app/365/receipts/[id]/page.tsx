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

/* ---------- parsing ---------- */

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

/* ---------- formatting ---------- */

const GLOW = "#FFFEFA";

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatHumanTimestamp(ts: number) {
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

function formatTime24WithSeconds(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
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

/* ---------- avatar (deterministic, matte) ---------- */

function firstGlyph(place: string) {
  const s = (place || "").trim();
  // first alphanumeric char
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/[A-Za-z0-9]/.test(c)) return c.toUpperCase();
  }
  return "?";
}

function hashString(s: string) {
  // small deterministic hash (stable)
  let h = 2166136261; // FNV-ish seed
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function avatarColors(place: string) {
  const h = hashString(place || "outflo") % 360;
  // matte, dark, muted
  const bg = `hsl(${h} 42% 22%)`;
  const fg = `hsl(${h} 80% 86%)`;
  return { bg, fg };
}

/* ---------- component ---------- */

export default function ReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();

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
    return (
      receipts.find((x) => x.id === id) ??
      receipts.find((x) => x.id === decodeURIComponent(id)) ??
      null
    );
  }, [receipts, id]);

  const computed = useMemo(() => {
    if (!receipt) return null;

    const dayKey = dayKeyLocal(receipt.ts);
    const sameDay = receipts.filter((r) => dayKeyLocal(r.ts) === dayKey);

    const dayCum = dayCumulativeAtMoment(receipt, receipts);
    const total365 = receipts.reduce((s, r) => s + r.amount, 0);

    const asc = [...sameDay].sort((a, b) => {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return a.id.localeCompare(b.id);
    });

    const idx = Math.max(0, asc.findIndex((r) => r.id === receipt.id));

    return {
      dayCum,
      total365,
      dayIndex: idx + 1,
      dayCount: asc.length,
      // kept for potential future use:
      dayTotal: sumDay(sameDay),
    };
  }, [receipt, receipts]);

  function close() {
    try {
      router.back();
    } catch {
      router.push("/365/receipts");
    }
  }

  if (!loaded) {
    return (
      <main style={wrap}>
        <div style={frame}>
          <div style={navBand}>
            <button onClick={close} style={xStyle} aria-label="Close">
              ×
            </button>
          </div>
          <div style={{ fontSize: 12, opacity: 0.55 }}>Loading…</div>
        </div>
      </main>
    );
  }

  if (!receipt || !computed) {
    return (
      <main style={wrap}>
        <div style={frame}>
          <div style={navBand}>
            <button onClick={close} style={xStyle} aria-label="Close">
              ×
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, paddingTop: 18 }}>
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

  const glyph = firstGlyph(receipt.place);
  const colors = avatarColors(receipt.place);

  return (
    <main style={wrap}>
      <div style={frame}>
        {/* NAV BAND (prevents overlap with hero) */}
        <div style={navBand}>
          <button onClick={close} style={xStyle} aria-label="Close">
            ×
          </button>
        </div>

        {/* 1) Hero (left-aligned spine, Cash App feel) */}
        <section style={section}>
          <div style={heroTopRow}>
            <div style={{ ...avatar, background: colors.bg, color: colors.fg }}>
              {glyph}
            </div>

            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <div style={merchant} title={receipt.place}>
                {receipt.place}
              </div>
              <div style={metaLine}>Miami, FL</div>
              <div style={metaLine}>{formatHumanTimestamp(receipt.ts)}</div>
            </div>
          </div>

          <div style={amount}>{formatMoney(receipt.amount)}</div>
        </section>

        <div style={divider} />

        {/* 2) Position */}
        <section style={section}>
          <Title>Position</Title>

          <div style={rows}>
            <Row
              label="Day cumulative (at this moment)"
              value={formatMoney(computed.dayCum)}
            />
            <Row
              label="365 rolling total (at this moment)"
              value={formatMoney(computed.total365)}
            />
            <Row
              label="Index in day"
              value={`${computed.dayIndex} of ${computed.dayCount}`}
              mono
            />
            <Row label="Street address" value="(placeholder)" />
            <Row label="City, State ZIP" value="(placeholder)" />
          </div>
        </section>

        <div style={divider} />

        {/* 3) Ledger */}
        <section style={section}>
          <Title>Ledger</Title>

          <div style={rows}>
            <Row label="Receipt ID" value={receipt.id} mono />
            <Row label="Full timestamp (24h + seconds)" value={formatTime24WithSeconds(receipt.ts)} mono />
            <Row label="Epoch time (ms)" value={String(receipt.ts)} mono />
            <Row label="Latitude / Longitude" value="(placeholder)" mono />
            <Row label="Payment method" value="(placeholder)" />
          </div>
        </section>

        <div style={divider} />

        {/* 4) Explore */}
        <section style={section}>
          <Title>Explore</Title>

          <div style={menu}>
            <MenuItem label="See all your transactions for this day" />
            <MenuItem label="View this merchant across 365 days" />
            <MenuItem label="Contact this merchant" />
            <MenuItem label="Learn how the Engine works" />
          </div>
        </section>

        <div style={divider} />

        {/* 5) Institutional Footer */}
        <section style={{ ...section, paddingBottom: 32 }}>
          <div style={footerBrand}>Outflō</div>
          <div style={footerLine}>[Address placeholder]</div>
          <div style={footerLine}>[City, State ZIP]</div>
          <div style={footerLine}>[Phone placeholder]</div>
        </section>
      </div>
    </main>
  );
}

/* ---------- tiny UI helpers ---------- */

function Title({ children }: { children: string }) {
  return (
    <div style={title}>
      {children}
    </div>
  );
}

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
    <div style={row}>
      <div style={rowLabel}>{label}</div>
      <div
        style={{
          ...rowValue,
          ...(mono ? { fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" } : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MenuItem({ label }: { label: string }) {
  return (
    <div style={menuItem}>
      <div style={{ fontSize: 16, opacity: 0.92 }}>{label}</div>
      <div style={{ fontSize: 22, opacity: 0.30 }}>›</div>
    </div>
  );
}

/* ---------- styles (no outer box, full screen) ---------- */

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "black",
  color: "white",
  display: "grid",
  placeItems: "start center",
  padding: "max(22px, 6vh) 18px",
};

const frame: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  boxSizing: "border-box",
  position: "relative",
};

const navBand: React.CSSProperties = {
  height: 56,
  display: "flex",
  alignItems: "center",
};

const xStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 30,
  opacity: 0.78,
  cursor: "pointer",
  padding: 0,
  width: 44,
  height: 44,
  lineHeight: "44px",
};

const section: React.CSSProperties = {
  display: "grid",
  gap: 14,
  padding: "10px 0",
};

const heroTopRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const avatar: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  fontWeight: 700,
  userSelect: "none",
  flex: "0 0 auto",
};

const merchant: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 650,
  letterSpacing: "-0.02em",
  opacity: 0.92,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const metaLine: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.58,
  letterSpacing: "0.02em",
};

const amount: React.CSSProperties = {
  fontSize: 62,
  fontWeight: 760,
  letterSpacing: "-0.05em",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
  color: GLOW,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.10)",
  margin: "14px 0",
};

const title: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.65,
  letterSpacing: "0.08em",
  textTransform: "none", // Title case as requested
};

const rows: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "baseline",
};

const rowLabel: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.55,
};

const rowValue: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.92,
  textAlign: "right",
  maxWidth: "60%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const menu: React.CSSProperties = {
  display: "grid",
};

const menuItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const footerBrand: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.75,
  letterSpacing: "0.02em",
};

const footerLine: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.40,
  lineHeight: 1.45,
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

