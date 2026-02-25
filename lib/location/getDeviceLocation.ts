/* ==========================================================
   OUTFLO — DEVICE LOCATION
   File: lib/location/getDeviceLocation.ts
   Scope: Promise-based wrapper for browser geolocation API
   ========================================================== */

/* ------------------------------
   Types
-------------------------------- */

export type DeviceLocation = {
  latitude: number;
  longitude: number;
};

export type DeviceLocationResult =
  | { status: "granted"; coords: DeviceLocation }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "error"; message: string };

/* ------------------------------
   Function
-------------------------------- */

export function getDeviceLocation(): Promise<DeviceLocationResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ status: "unavailable" });
      return;
    }

    if (!("geolocation" in navigator)) {
      resolve({ status: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: "granted",
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ status: "denied" });
        } else {
          resolve({
            status: "error",
            message: error.message,
          });
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000, // allow cached position (10 minutes)
      }
    );
  });
}