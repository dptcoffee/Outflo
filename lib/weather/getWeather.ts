/* ==========================================================
   OUTFLO — WEATHER FETCH
   File: lib/weather/getWeather.ts
   Scope: Provider-agnostic weather fetch + normalization
   ========================================================== */

/* ------------------------------
   Types
-------------------------------- */

export type NormalizedCurrentWeather = {
  temp: number;              // degrees (unit defined by provider config)
  condition: string;         // human-readable summary
  cloud_density: number;     // 0 → 1
  rain_factor: number;       // 0 → 1
  storm_factor: number;      // 0 → 1
  label: string;             // city / place name
};

export type NormalizedHourlyWeather = {
  timestamp: number;         // epoch ms
  temp: number;
  cloud_density: number;
  rain_factor: number;
};

export type NormalizedDailyWeather = {
  date: number;              // epoch ms (start of day)
  temp_min: number;
  temp_max: number;
  cloud_density: number;
  rain_factor: number;
};

export type NormalizedWeather = {
  current: NormalizedCurrentWeather;
  hourly: NormalizedHourlyWeather[];
  daily: NormalizedDailyWeather[];
};

/* ------------------------------
   Public Function
-------------------------------- */

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<NormalizedWeather> {
  /* ------------------------------
     Provider Call (Replaceable)
  -------------------------------- */

  // Example placeholder endpoint.
  // Replace with actual provider of choice.
  const response = await fetch(
    `/api/weather?lat=${latitude}&lon=${longitude}`
  );

  if (!response.ok) {
    throw new Error("Weather fetch failed");
  }

  const providerData = await response.json();

  /* ------------------------------
     Normalization Adapter
  -------------------------------- */

  return normalizeProviderWeather(providerData);
}

/* ------------------------------
   Provider Normalization
-------------------------------- */

function normalizeProviderWeather(data: any): NormalizedWeather {
  // NOTE:
  // This mapping section is the only place that
  // knows the provider's response shape.
  // Swapping providers requires editing only this function.

  const current: NormalizedCurrentWeather = {
    temp: data.current?.temp ?? 0,
    condition: data.current?.condition ?? "Unknown",
    cloud_density: clamp((data.current?.clouds ?? 0) / 100, 0, 1),
    rain_factor: clamp(extractRainFactor(data.current), 0, 1),
    storm_factor: clamp(extractStormFactor(data.current), 0, 1),
    label: data.location?.name ?? "",
  };

  const hourly: NormalizedHourlyWeather[] =
    (data.hourly ?? []).map((h: any) => ({
      timestamp: h.dt * 1000,
      temp: h.temp,
      cloud_density: clamp((h.clouds ?? 0) / 100, 0, 1),
      rain_factor: clamp(extractRainFactor(h), 0, 1),
    }));

  const daily: NormalizedDailyWeather[] =
    (data.daily ?? []).map((d: any) => ({
      date: d.dt * 1000,
      temp_min: d.temp?.min ?? 0,
      temp_max: d.temp?.max ?? 0,
      cloud_density: clamp((d.clouds ?? 0) / 100, 0, 1),
      rain_factor: clamp(extractRainFactor(d), 0, 1),
    }));

  return { current, hourly, daily };
}

/* ------------------------------
   Helpers
-------------------------------- */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extractRainFactor(obj: any): number {
  if (!obj) return 0;
  if (obj.rain?.["1h"]) return clamp(obj.rain["1h"] / 10, 0, 1);
  return 0;
}

function extractStormFactor(obj: any): number {
  const condition = obj?.condition?.toLowerCase?.() ?? "";
  if (condition.includes("storm") || condition.includes("thunder")) {
    return 1;
  }
  return 0;
}