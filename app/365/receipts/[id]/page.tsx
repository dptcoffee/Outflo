// app/365/receipts/[id]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number;
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";
const SYSTEM_EPOCH_KEY = "outflo_system_epoch_v1";

const GLOW = "#FFFEFA";

const FOOTER_STREET = "314 Outflō Grove";
const FOOTER_CITYSTATEZIP = "Miami, FL 33133";
const FOOTER_PHONE = "+1 (305) 000-0000";

const LAT_33133 = "25.7280";
const LNG_33133 = "-80.2374";

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

function getOrCreateSystemEpoch(): number {
  try {
    const raw = localStorage.getItem(SYSTEM_EPOCH_KEY);
    const n = raw ? Number(raw) : NaN;
    if (Number.isFinite(n) && n > 0) return n;

    const now = Date.now();
    localStorage.setItem(SYSTEM_EPOCH_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatHeroDateTime(ts: number) {
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

function formatExploreDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime24WithSeconds(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
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

function receiptSuffix(id: string) {
  const parts = id.split("-");
  return parts.length > 1 ? parts[1] : id;
}

function firstGlyph(place: string) {
  const s = (place || "").trim();
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/[A-Za-z0-9]/.test(c)) return c.toUpperCase();
  }
  return "?";
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function avatarColors(place: string) {
  const h = hashString(place || "outflo") % 360;
  return {
    bg: `hsl(${h} 42% 22%)`,
    fg: `hsl(${h} 80% 86%)`,
  };
}

export default function ReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : (raw ?? "");

  const [loaded, setLoaded] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [systemEpoch, setSystemEpoch] = useState<number | null>(null);

  useEffect(() => {
    setSystemEpoch(getOrCreateSystemEpoch());
  }, []);

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
      dayTotal: sumDay(sameDay),
      dayKey,
    };
  }, [receipt, receipts]);

  let userEpochTime = "(unavailable)";
  if (systemEpoch != null && receipt != null) {
    const elapsedMs = Math.max(0, receipt.ts - systemEpoch);

    const totalSeconds = Math.floor(elapsedMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const remainder = totalSeconds % 86400;

    const hours = Math.floor(remainder / 3600);
    const minutes = Math.floor((remainder % 3600) / 60);
    const seconds = remainder % 60;

    const dayLabel = days === 1 ? "day" : "days";

    userEpochTime =
      `${days} ${dayLabel} · ` +
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;
  }

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
        <button onClick={close} style={xFixed} aria-label="Close">
          ×
        </button>

        <div
          style={{
            width: "100%",
            maxWidth: 720,
            paddingTop: NAV_H,
            fontSize: 12,
            opacity: 0.55,
          }}
        >
          Loading…
        </div>
      </main>
    );
  }

  if (!receipt || !computed) {
    return (
      <main style={wrap}>
        <button onClick={close} style={xFixed} aria-label="Close">
          ×
        </button>

        <div
          style={{
            width: "100%",
            maxWidth: 720,
            paddingTop: NAV_H,
            display: "grid",
            gap: 10,
          }}
        >
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
      </main>
    );
  }

  const glyph = firstGlyph(receipt.place);
  const colors = avatarColors(receipt.place);
  const merchantName = (receipt.place || "").trim() || "Merchant";
  const exploreDate = formatExploreDate(receipt.ts);
  const dayHref = `/365/day/${computed.dayKey}`;

  return (
    <main style={wrap}>
      <button onClick={close} style={xFixed} aria-label="Close">
        ×
      </button>

      <div style={frame}>
        {/* --- HERO --- */}
        <section style={{ ...section, paddingTop: NAV_H }}>
          <div style={heroStack}>
            <div style={{ ...avatar, background: colors.bg, color: colors.fg }}>
              {glyph}
            </div>

            <div style={heroInfo}>
              <div style={merchant} title={merchantName}>
                {merchantName}
              </div>
              <div style={metaLine}>{formatHeroDateTime(receipt.ts)}</div>
            </div>

            <div style={amount}>{formatMoney(receipt.amount)}</div>
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- POSITION --- */}
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
            <Row label="City, State" value="Miami, FL" />
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- LEDGER --- */}
        <section style={section}>
          <Title>Ledger</Title>

          <div style={rows}>
            <Row label="Receipt ID" value={`#${receiptSuffix(receipt.id)}`} mono />
            <Row
              label="Time (24h + seconds)"
              value={formatTime24WithSeconds(receipt.ts)}
              mono
            />
            <Row label="Epoch time (ms)" value={String(receipt.ts)} mono />
            <Row label="User epoch time" value={userEpochTime} mono />
            <Row
              label="Latitude / Longitude"
              value={`${LAT_33133}, ${LNG_33133}`}
              mono
            />
            <Row label="Payment method" value="coming soon" />
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- EXPLORE --- */}
        <section style={section}>
          <Title>Explore</Title>

          <div style={menu}>
            <MenuItem href={dayHref} label={`See all your transactions for ${exploreDate}`} />
            <MenuItem href="/365/place" label={`View your ${merchantName} transactions across time`} />
            <MenuItem href="/365/engine" label="Learn how the Engine works"/>
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- FOOTER --- */}
        <section style={footerSection}>
          <div style={footerBrand}>Outflō</div>
          <div style={footerLine}>{FOOTER_STREET}</div>
          <div style={footerLine}>{FOOTER_CITYSTATEZIP}</div>
          <div style={footerLine}>{FOOTER_PHONE}</div>

          <div style={{ height: 14 }} />

          <Link href="/" style={footerLink}>
            outflo.is
          </Link>
        </section>
      </div>
    </main>
  );
}

function Title({ children }: { children: string }) {
  return <div style={title}>{children}</div>;
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
          ...(mono
            ? { fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }
            : {}),
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function MenuItem({ label, href }: { label: string; href?: string }) {
  const inner = (
    <div style={menuItem}>
      <div style={menuLabel}>{label}</div>
      <div style={chev}>›</div>
    </div>
  );

  if (!href) return inner;

  return (
    <Link href={href} style={menuLink}>
      {inner}
    </Link>
  );
}

const NAV_H = 56;

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

const xFixed: React.CSSProperties = {
  position: "fixed",
  top: 6,
  left: 6,
  width: 40,
  height: 40,
  lineHeight: "40px",
  padding: 0,
  borderRadius: 999,
  background: "rgba(0,0,0,0.9)",
  border: "none",
  color: "white",
  fontSize: 26,
  opacity: 1,
  cursor: "pointer",
  zIndex: 50,
};

const section: React.CSSProperties = {
  display: "grid",
  gap: 14,
  padding: "10px 0",
};

const sectionDivider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.10)",
  margin: "14px 0",
};

const heroStack: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const avatar: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontSize: 20,
  fontWeight: 750,
  userSelect: "none",
};

const heroInfo: React.CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 0,
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
  marginTop: 4,
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 650,
  letterSpacing: "-0.01em",
  opacity: 0.92,
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
  maxWidth: "62%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const menu: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const menuItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "8px 0",
};

const menuLabel: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.92,
};

const chev: React.CSSProperties = {
  fontSize: 22,
  opacity: 0.30,
  lineHeight: "22px",
};

const menuLink: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "block",
};

const footerSection: React.CSSProperties = {
  display: "grid",
  gap: 2,
  padding: "10px 0 32px",
};

const footerBrand: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 650,
  opacity: 0.78,
  letterSpacing: "0.02em",
  marginBottom: 2,
};

const footerLine: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.42,
  lineHeight: 1.12,
};

const footerLink: React.CSSProperties = {
  fontSize: 12,
  color: GLOW,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  opacity: 0.95,
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


