/* ==========================================================
   OUTFLO — HOME
   File: app/home/page.tsx
   Scope: Orbit room rendering (environment + orientation)
   ========================================================== */

"use client";

/* ------------------------------
   Imports
-------------------------------- */

import React from "react";
import { useHomeEnvironment } from "@/lib/home/useHomeEnvironment";

/* ------------------------------
   Component
-------------------------------- */

export default function HomePage() {
  const { environment, weather, location } = useHomeEnvironment(null); // manualLocation null for now

  const { brightness, hueShift, starOpacity, contrastModifier, glowModifier } =
    environment;

  const timeLabel = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* ------------------------------
     Derived Styles
  -------------------------------- */

  // Keep sky dark and restrained. Brightness lifts it, but never to white.
  const skyLightness = 6 + brightness * 18; // 6% → 24%
  const skyHue = 220 + hueShift; // cool baseline + subtle drift
  const skySat = 32;

  const backgroundStyle: React.CSSProperties = {
    background: `radial-gradient(1200px 800px at 50% 35%, hsl(${skyHue} ${skySat}% ${
      skyLightness + 6
    }%), hsl(${skyHue} ${skySat}% ${skyLightness}%))`,
    transition: "background 1s linear",
  };

  const roomStyle: React.CSSProperties = {
    filter: `contrast(${contrastModifier})`,
  };

  const oStyle: React.CSSProperties = {
    boxShadow: `0 0 ${18 + brightness * 36}px rgba(255,255,255,${
      0.18 + brightness * 0.22
    })`,
    opacity: 0.95,
  };

  const starLayerStyle: React.CSSProperties = {
    opacity: starOpacity * 0.22, // subtle by default
    transition: "opacity 1s linear",
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 1px, transparent 2px),
      radial-gradient(circle at 70% 40%, rgba(255,255,255,0.6) 1px, transparent 2px),
      radial-gradient(circle at 40% 80%, rgba(255,255,255,0.4) 1px, transparent 2px),
      radial-gradient(circle at 85% 75%, rgba(255,255,255,0.5) 1px, transparent 2px)
    `,
    backgroundRepeat: "repeat",
    backgroundSize: "520px 520px, 760px 760px, 980px 980px, 1180px 1180px",
  };

  const labelStyle: React.CSSProperties = {
    opacity: 0.78,
  };

  /* ------------------------------
     Render
  -------------------------------- */

  return (
    <div
      style={backgroundStyle}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Stars (never a grid) */}
      <div
        style={starLayerStyle}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Room */}
      <div
        style={roomStyle}
        className="relative flex min-h-screen items-center justify-center"
      >
        {/* O (placeholder ring; final O component can replace this) */}
        <div
          className="h-40 w-40 rounded-full border border-white"
          style={oStyle}
        />

        {/* Orientation (lower third, no scroll, no clutter) */}
        <div
          style={labelStyle}
          className="absolute bottom-12 w-full text-center text-white"
        >
          <div className="text-sm">{timeLabel}</div>

          {weather?.current ? (
            <div className="text-sm">
              {weather.current.temp}° · {weather.current.condition}
            </div>
          ) : (
            <div className="text-sm" style={{ opacity: 0.55 }}>
              {/* Time-only mode if location denied / weather unavailable */}
              —
            </div>
          )}

          {location.source !== "none" && weather?.current?.label ? (
            <div className="text-xs" style={{ opacity: 0.6 }}>
              {weather.current.label}
            </div>
          ) : null}
        </div>

        {/* Nav placeholder (keep your existing control if you already have one elsewhere) */}
        <div className="absolute bottom-4 w-full flex items-center justify-center">
          <div className="flex gap-6 rounded-full border border-white/10 bg-black/30 px-5 py-2 text-xs text-white/70 backdrop-blur">
            <span className="text-white">Home</span>
            <span>Systems</span>
            <span>Time</span>
          </div>
        </div>
      </div>
    </div>
  );
}