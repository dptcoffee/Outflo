// app/money/place/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Receipt = {
  id: string;
  place: string;
  amount: number;
  ts: number; // epoch ms
};

const STORAGE_KEY = "outflo_receipts_v1";
const BACKUP_KEY = "outflo_receipts_v1_backup";
const SYSTEM_EPOCH_KEY = "outflo_system_epoch_v1";

const GLOW = "#FFFEFA";
const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------------- parsing ---------------- */

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

/* ---------------- epoch helpers ---------------- */

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

/* ---------------- formatting ---------------- */

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* ---------------- identity ---------------- */

function slugify(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------------- avatar ---------------- */

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

/* ---------------- component ---------------- */

export default function PlacePage() {
  const router = useRouter();
  const params = useParams();
  const raw = params?.slug;
  const slug = Array.isArray(raw) ? raw[0] : (raw ?? "");

  const [loaded, setLoaded] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [systemEpoch, setSystemEpoch] = useState<number | null>(null);
  const [windowDays, setWindowDays] = useState<number>(30);

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

  const merchantName = useMemo(() => {
    if (!slug) return "";
    const decoded = (() => {
      try {
        return decodeURIComponent(slug);
      } catch {
        return slug;
      }
    })();

    // 1) exact slug match
    const hit =
      receipts.find((r) => slugify(r.place) === slugify(decoded)) ??
      receipts.find((r) => r.place.trim().toLowerCase() === decoded.trim().toLowerCase()) ??
      null;

    return (hit?.place || decoded || "").trim();
  }, [receipts, slug]);

  const now = Date.now();

  const daysSinceEpoch = useMemo(() => {
    if (systemEpoch == null) return 365;
    const elapsed = Math.max(0, now - systemEpoch);
    const d = Math.max(1, Math.ceil(elapsed / DAY_MS));
    return d;
  }, [systemEpoch, now]);

  const maxWindow = useMemo(() => clamp(daysSinceEpoch, 1, 365), [daysSinceEpoch]);

  useEffect(() => {
    setWindowDays((d) => clamp(d, 1, maxWindow));
  }, [maxWindow]);

  const view = useMemo(() => {
    const decodedSlug = (() => {
      try {
        return decodeURIComponent(slug);
      } catch {
        return slug;
      }
    })();
    const targetSlug = slugify(decodedSlug);

    const matching = receipts.filter((r) => slugify(r.place) === targetSlug);

    const endMs = now;
    const startMs = endMs - windowDays * DAY_MS;

    const inWindow = matching.filter((r) => r.ts >= startMs && r.ts <= endMs);
    const total = inWindow.reduce((s, r) => s + r.amount, 0);
    const count = inWindow.length;
    const avg = count ? total / count : 0;

    const asc = [...inWindow].sort((a, b) => a.ts - b.ts);
    const first = asc[0] ?? null;
    const last = asc[asc.length - 1] ?? null;

    const allTotal = matching.reduce((s, r) => s + r.amount, 0);

    return {
      matching,
      inWindow,
      total,
      count,
      avg,
      first,
      last,
      startMs,
      endMs,
      allTotal,
    };
  }, [receipts, slug, windowDays, now]);

  function close() {
    try {
      router.back();
    } catch {
      router.push("/app/money/receipts");
    }
  }

  const glyph = firstGlyph(merchantName || "Merchant");
  const colors = avatarColors(merchantName || "Merchant");

  if (!loaded) {
    return (
      <main style={wrap}>
        <button onClick={close} style={xFixed} aria-label="Close">
          ×
        </button>

        <div style={{ width: "100%", maxWidth: 720, paddingTop: NAV_H, fontSize: 12, opacity: 0.55 }}>
          Loading…
        </div>
      </main>
    );
  }

  if (!merchantName || view.matching.length === 0) {
    return (
      <main style={wrap}>
        <button onClick={close} style={xFixed} aria-label="Close">
          ×
        </button>

        <div style={{ width: "100%", maxWidth: 720, paddingTop: NAV_H, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 16, opacity: 0.9 }}>Merchant not found.</div>
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            slug: <span style={{ fontVariantNumeric: "tabular-nums" }}>{slug || "(empty)"}</span>
            {" · "}
            vault: <span style={{ fontVariantNumeric: "tabular-nums" }}>{receipts.length}</span>
          </div>

          <Link href="/app/money/receipts" style={linkPill}>
            Back to receipts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <button onClick={close} style={xFixed} aria-label="Close">
        ×
      </button>

      <div style={frame}>
        {/* --- HERO --- */}
        <section style={{ ...section, paddingTop: NAV_H }}>
          <div style={heroStack}>
            <div style={{ ...avatar, background: colors.bg, color: colors.fg }}>{glyph}</div>

            <div style={heroInfo}>
              <div style={merchant} title={merchantName}>
                {merchantName}
              </div>
              <div style={metaLine}>
                Across time ·{" "}
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{view.matching.length}</span>{" "}
                receipts
              </div>
            </div>

            <div style={amount}>{formatMoney(view.total)}</div>
            <div style={subAmount}>
              {formatDate(view.startMs)} → {formatDate(view.endMs)}
            </div>
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- WINDOW (breathing) --- */}
        <section style={section}>
          <Title>Window</Title>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 14, opacity: 0.55 }}>Days</div>
              <div style={{ fontSize: 14, opacity: 0.92, fontVariantNumeric: "tabular-nums" }}>
                {windowDays} {windowDays === 1 ? "day" : "days"}
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={maxWindow}
              step={1}
              value={windowDays}
              onChange={(e) => setWindowDays(clamp(Number(e.target.value), 1, maxWindow))}
              style={slider}
              aria-label="Window days"
            />

            <div style={{ display: "grid", gap: 12 }}>
              <Row label="Total (window)" value={formatMoney(view.total)} />
              <Row label="Count (window)" value={String(view.count)} mono />
              <Row label="Avg (window)" value={formatMoney(view.avg)} />
              <Row
                label="First (window)"
                value={view.first ? `${formatDate(view.first.ts)} · ${formatTime(view.first.ts)}` : "(none)"}
              />
              <Row
                label="Last (window)"
                value={view.last ? `${formatDate(view.last.ts)} · ${formatTime(view.last.ts)}` : "(none)"}
              />
            </div>
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- LEDGER --- */}
        <section style={section}>
          <Title>Ledger</Title>

          <div style={rows}>
            <Row label="Total (all time)" value={formatMoney(view.allTotal)} />
            <Row label="Receipts (all time)" value={String(view.matching.length)} mono />
          </div>
        </section>

        <div style={sectionDivider} />

        {/* --- EXPLORE (hold: no links yet, but keep the surface) --- */}
        <section style={section}>
          <Title>Explore</Title>

          <div style={menu}>
            <div style={menuItem}>
              <div style={menuLabel}>See tiles for this window</div>
              <div style={chev}>›</div>
            </div>
            <div style={menuItem}>
              <div style={menuLabel}>Export CSV (merchant)</div>
              <div style={chev}>›</div>
            </div>
          </div>

          <div style={{ fontSize: 12, opacity: 0.42 }}>Coming soon.</div>
        </section>
      </div>
    </main>
  );
}

/* ---------------- helpers ---------------- */

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
          ...(mono ? { fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" } : {}),
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

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

const subAmount: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.55,
  letterSpacing: "0.02em",
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

const slider: React.CSSProperties = {
  width: "100%",
  accentColor: GLOW,
  opacity: 0.9,
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

const linkPill: React.CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  color: "white",
  fontSize: 12,
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.10)",
};
