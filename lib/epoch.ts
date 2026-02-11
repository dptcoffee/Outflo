// app/lib/epoch.ts
const KEY = "outflo_epoch_startedAt_ms";

export function getEpochStartedAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function ensureEpochStartedAt(now: number): number {
  if (typeof window === "undefined") return now; // server render fallback
  const existing = getEpochStartedAt();
  if (existing) return existing;
  window.localStorage.setItem(KEY, String(now));
  return now;
}

// optional (keep hidden / debug-only later)
export function clearEpoch() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
