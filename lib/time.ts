// app/lib/time.ts
export const YEAR_DAYS = 365;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const YEAR_MS = YEAR_DAYS * DAY_MS;

// "now" source (v0 = device time)
export function nowMs() {
  return Date.now();
}

export function windowStartMs(now: number, startedAt: number) {
  return Math.max(startedAt, now - YEAR_MS);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
