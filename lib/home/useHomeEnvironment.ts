/* ==========================================================
   OUTFLO — HOME ENVIRONMENT ORCHESTRATOR
   File: lib/home/useHomeEnvironment.ts
   Scope: Integrates location, weather, and environment layers
   ========================================================== */

"use client";

/* ------------------------------
   Imports
-------------------------------- */

import { useEffect, useState } from "react";
import { useEnvironment } from "../environment/useEnvironment";
import { getDeviceLocation } from "../location/getDeviceLocation";
import {
  resolveLocation,
  ManualLocation,
  ResolvedLocation,
} from "../location/resolveLocation";
import { getWeather, NormalizedWeather } from "../weather/getWeather";

/* ------------------------------
   Types
-------------------------------- */

type HomeEnvironmentState = {
  environment: ReturnType<typeof useEnvironment>;
  location: ResolvedLocation;
  weather: NormalizedWeather | null;
  loadingWeather: boolean;
};

/* ------------------------------
   Hook
-------------------------------- */

export function useHomeEnvironment(
  manualLocation: ManualLocation | null
): HomeEnvironmentState {
  const [deviceResult, setDeviceResult] =
    useState<any>({ status: "unavailable" });

  const [resolvedLocation, setResolvedLocation] =
    useState<ResolvedLocation>({ source: "none" });

  const [weather, setWeather] =
    useState<NormalizedWeather | null>(null);

  const [loadingWeather, setLoadingWeather] =
    useState(false);

  /* ------------------------------
     Request Device Location
  -------------------------------- */

  useEffect(() => {
    getDeviceLocation().then((result) => {
      setDeviceResult(result);
    });
  }, []);

  /* ------------------------------
     Resolve Authoritative Location
  -------------------------------- */

  useEffect(() => {
    const resolved = resolveLocation(
      deviceResult,
      manualLocation
    );
    setResolvedLocation(resolved);
  }, [deviceResult, manualLocation]);

  /* ------------------------------
     Fetch Weather (if location exists)
  -------------------------------- */

  useEffect(() => {
    if (resolvedLocation.source === "none") {
      setWeather(null);
      return;
    }

    setLoadingWeather(true);

    getWeather(
      resolvedLocation.latitude,
      resolvedLocation.longitude
    )
      .then((data) => {
        setWeather(data);
      })
      .catch(() => {
        setWeather(null);
      })
      .finally(() => {
        setLoadingWeather(false);
      });
  }, [resolvedLocation]);

  /* ------------------------------
     Environment State
  -------------------------------- */

  const environment = useEnvironment({
    cloud_density: weather?.current.cloud_density ?? 0,
    rain_factor: weather?.current.rain_factor ?? 0,
    storm_factor: weather?.current.storm_factor ?? 0,
  });

  return {
    environment,
    location: resolvedLocation,
    weather,
    loadingWeather,
  };
}