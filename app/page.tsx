"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const EPOCH_KEY = "outflo_app_epoch_start_v1";

function getOrCreateEpochStart(): number {
  try {
    const existing = localStorage.getItem(EPOCH_KEY);
    const parsed = existing ? Number(existing) : NaN;

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    const now = Date.now();
    localStorage.setItem(EPOCH_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function pad13(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(13, "0");
}

export default function Home() {
  const [now, setNow] = useState(() => Date.now());
  const [anchor, setAnchor] = useState<number | null>(null);

  useEffect(() => {
    setAnchor(getOrCreateEpochStart());

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 50);

    return () => window.clearInterval(id);
  }, []);

  const msSinceStart = useMemo(() => {
    if (anchor == null) return 0;
    return now - anchor;
  }, [now, anchor]);

  return (
    <main
      style={{
        minHeight: "100svh",
        width: "100vw",
        backgroundColor: "black",
        display: "grid",
        placeItems: "center",
        position: "relative",
      }}
    >
      <Link href="/state" style={{ display: "inline-block" }}>
        <Image
          src="/outflo.jpg"
          alt="Outflō"
          width={320}
          height={320}
          priority
        />
      </Link>

      {/* App Epoch Hum (13-digit zero-based ms) */}
      <div
        style={{
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
        }}
      >
        {pad13(msSinceStart)}
      </div>
    </main>
  );
}



