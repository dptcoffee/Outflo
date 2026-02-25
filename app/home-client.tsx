/* ==========================================================
   OUTFLO — HOME (VAULT DOOR)
   File: app/page.tsx
   Scope: Public landing with vault unlock and system hum (no local epoch)
   ========================================================== */

"use client";

/* ------------------------------
   Imports
-------------------------------- */
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ------------------------------
   Constants
-------------------------------- */
const DEFAULT_NEXT = "/app/systems";

/* ------------------------------
   Helpers
-------------------------------- */
function pad13(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(13, "0");
}

async function unlockVault(key: string) {
  const res = await fetch("/api/unlock", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });

  return res.ok;
}

function normalizeNextHref(nextRaw: string | null) {
  if (!nextRaw) return DEFAULT_NEXT;
  if (!nextRaw.startsWith("/")) return DEFAULT_NEXT;

  // Block obvious loops back to public surfaces
  if (nextRaw === "/" || nextRaw.startsWith("/login") || nextRaw.startsWith("/auth")) {
    return DEFAULT_NEXT;
  }

  return nextRaw;
}

/* ------------------------------
   Component
-------------------------------- */
export default function HomeClient() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 50);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main style={wrap}>
      <div style={brand}>
        <Link href="/tools/gain" style={{ display: "inline-block" }}>
          <Image src="/outflo.jpg" alt="Outflō" width={320} height={320} priority />
        </Link>
      </div>

      <Suspense fallback={null}>
        <VaultDoor />
      </Suspense>

      <div style={hum}>{pad13(now)}</div>
    </main>
  );
}

/* ------------------------------
   Subcomponents
-------------------------------- */
function VaultDoor() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextHref = useMemo(() => {
    const raw = sp.get("next");
    return normalizeNextHref(raw);
  }, [sp]);

  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const k = key.trim();
    if (!k) return;

    setBusy(true);
    setErr(null);

    try {
      const ok = await unlockVault(k);
      if (!ok) {
        setErr("Incorrect key.");
        setBusy(false);
        return;
      }

      // Use router if possible; fallback to hard nav for safety
      try {
        router.push(nextHref);
      } catch {
        window.location.href = nextHref;
      }
    } catch {
      setErr("Network error.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={vault}>
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Vault key"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        style={input}
      />
      <button type="submit" disabled={busy || key.trim().length === 0} style={button}>
        {busy ? "…" : "Enter"}
      </button>
      {err ? <div style={error}>{err}</div> : null}
    </form>
  );
}

/* ------------------------------
   Styles
-------------------------------- */
const wrap: React.CSSProperties = {
  minHeight: "100svh",
  width: "100vw",
  backgroundColor: "black",
  display: "grid",
  placeItems: "center",
  position: "relative",
};

const brand: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
};

const vault: React.CSSProperties = {
  position: "fixed",
  bottom: "max(calc(env(safe-area-inset-bottom) + 88px), 96px)",
  left: 18,
  right: 18,
  maxWidth: 520,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 10,
  alignItems: "center",
  zIndex: 20,
};

const input: React.CSSProperties = {
  height: 44,
  borderRadius: 12,
  padding: "0 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "white",
  outline: "none",
  fontSize: 14,
};

const button: React.CSSProperties = {
  height: 44,
  borderRadius: 12,
  padding: "0 14px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  fontSize: 14,
  cursor: "pointer",
};

const error: React.CSSProperties = {
  gridColumn: "1 / -1",
  fontSize: 12,
  color: "rgba(255,120,120,0.95)",
  opacity: 0.95,
  marginTop: -2,
};

const hum: React.CSSProperties = {
  position: "fixed",
  top: "calc(env(safe-area-inset-top) + 16px)",
  left: 18,
  fontSize: 14,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "0.06em",
  color: "white",
  opacity: 1,
  textShadow: "0 0 12px rgba(255,255,255,0.6)",
  userSelect: "none",
  zIndex: 10,
};