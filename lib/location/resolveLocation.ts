/* ==========================================================
   OUTFLO — LOCATION RESOLVER
   File: lib/location/resolveLocation.ts
   Scope: Determines authoritative runtime location source
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */

import { DeviceLocationResult } from "./getDeviceLocation";

/* ------------------------------
   Types
-------------------------------- */

export type ManualLocation = {
  latitude: number;
  longitude: number;
  label: string; // city name
};

export type ResolvedLocation =
  | {
      source: "device";
      latitude: number;
      longitude: number;
    }
  | {
      source: "manual";
      latitude: number;
      longitude: number;
      label: string;
    }
  | {
      source: "none";
    };

/* ------------------------------
   Function
-------------------------------- */

export function resolveLocation(
  deviceResult: DeviceLocationResult,
  manualLocation: ManualLocation | null
): ResolvedLocation {
  // Priority 1 — Device (if granted)
  if (deviceResult.status === "granted") {
    return {
      source: "device",
      latitude: deviceResult.coords.latitude,
      longitude: deviceResult.coords.longitude,
    };
  }

  // Priority 2 — Manual (if set)
  if (manualLocation) {
    return {
      source: "manual",
      latitude: manualLocation.latitude,
      longitude: manualLocation.longitude,
      label: manualLocation.label,
    };
  }

  // Priority 3 — None (time-only mode)
  return { source: "none" };
}