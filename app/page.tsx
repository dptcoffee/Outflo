"use client";

// app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 50); // smooth hum, not insane
    return () => window.clearInterval(id);
  }, []);

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

      {/* Epoch hum (13-digit ms) */}
      <div
        style={{
          position: "fixed",
          left: 18,
          bottom: 18,
          fontSize: 14,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.06em",
          opacity: 0.55,
          color: "white",
          textShadow: "0 0 10px rgba(255,255,255,0.45)",
          userSelect: "none",
        }}
      >
        {now}
      </div>
    </main>
  );
}



