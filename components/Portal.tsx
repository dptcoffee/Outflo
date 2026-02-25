/* ==========================================================
   OUTFLO — PORTAL (ASSET-BASED)
   File: components/Portal.tsx
   Scope: Public portal UI; uses shipped icon asset and fades to /login
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

/* ------------------------------
   Component
-------------------------------- */
export default function Portal() {
  const router = useRouter();
  const [fading, setFading] = useState(false);

  function enter() {
    if (fading) return;
    setFading(true);
    setTimeout(() => router.push("/login"), 400);
  }

  return (
    <main
      onClick={enter}
      aria-label="Outflō portal — tap to enter"
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "opacity 400ms ease",
        opacity: fading ? 0 : 1,
      }}
    >
      <Image
        src="/icon.jpg"       // <- CHANGE THIS to the actual filename in /public
        alt="Outflō"
        width={320}
        height={320}
        priority
      />
    </main>
  );
}