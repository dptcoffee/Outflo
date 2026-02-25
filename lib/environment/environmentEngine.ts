/* ==========================================================
   OUTFLO — ENVIRONMENT ENGINE
   File: lib/environment/environmentEngine.ts
   Scope: Deterministic orbital environment state generator
   ========================================================== */

/* ------------------------------
   Types
-------------------------------- */

export type EnvironmentInput = {
  date: Date;               // local device time
  cloud_density: number;    // 0 → 1
  rain_factor: number;      // 0 → 1
  storm_factor: number;     // 0 → 1
};

export type EnvironmentState = {
  brightness: number;        // 0 → 1
  hueShift: number;          // degree offset
  lightAngle: number;        // 0 → 360
  starOpacity: number;       // 0 → 1
  cloudEnabled: boolean;
  cloudDriftOffset: number;
  contrastModifier: number;  // 0 → 1 (1 = normal)
  glowModifier: number;      // multiplier (1 = normal)
};

/* ------------------------------
   Engine
-------------------------------- */

export function getEnvironmentState(
  input: EnvironmentInput
): EnvironmentState {
  const { date, cloud_density, rain_factor, storm_factor } = input;

  /* ------------------------------
     Time Normalization
  -------------------------------- */

  const seconds =
    date.getHours() * 3600 +
    date.getMinutes() * 60 +
    date.getSeconds();

  const t = seconds / 86400; // normalized 0 → 1 day

  /* ------------------------------
     Brightness (Cosine Curve)
  -------------------------------- */

  const peakShift = 0.375; // aligns perceptual midday
  const baseBrightness =
    0.5 + 0.5 * Math.cos(2 * Math.PI * (t - peakShift));

  /* ------------------------------
     Dawn / Dusk Slope Amplification
  -------------------------------- */

  const dawnCenter = 0.25; // ~6am
  const duskCenter = 0.75; // ~6pm

  const slopeBoost =
    gaussian(t, dawnCenter, 0.04) +
    gaussian(t, duskCenter, 0.04);

  const brightness = clamp(
    baseBrightness + slopeBoost * 0.08,
    0,
    1
  );

  /* ------------------------------
     Light Vector
  -------------------------------- */

  const lightAngle = (t * 360) % 360;

  /* ------------------------------
     Hue Shift (Temperature Drift)
  -------------------------------- */

  const hueShift = (0.5 - brightness) * 12;

  /* ------------------------------
     Star Visibility
  -------------------------------- */

  const starOpacity = clamp(
    (1 - brightness) * (1 - cloud_density),
    0,
    1
  );

  /* ------------------------------
     Cloud State
  -------------------------------- */

  const cloudEnabled = cloud_density >= 0.6;

  const cloudDriftOffset = t * 100;

  /* ------------------------------
     Rain / Storm Modifiers
  -------------------------------- */

  const contrastModifier = clamp(
    1 - rain_factor * 0.15 - storm_factor * 0.25,
    0.6,
    1
  );

  const glowModifier = clamp(
    1 - rain_factor * 0.1 - storm_factor * 0.2,
    0.7,
    1
  );

  return {
    brightness,
    hueShift,
    lightAngle,
    starOpacity,
    cloudEnabled,
    cloudDriftOffset,
    contrastModifier,
    glowModifier,
  };
}

/* ------------------------------
   Helpers
-------------------------------- */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function gaussian(x: number, center: number, width: number) {
  const diff = x - center;
  return Math.exp(-(diff * diff) / (2 * width * width));
}