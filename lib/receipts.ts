// app/lib/receipts.ts
export type Receipt = {
  id: string;
  vendor: string;
  amountCents: number;
  occurredAtMs: number; // UTC ms
};

const KEY = "outflo_receipts_v0";

export function loadReceipts(): Receipt[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Receipt[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveReceipts(receipts: Receipt[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(receipts));
}

export function appendReceipt(r: Receipt) {
  const existing = loadReceipts();
  saveReceipts([r, ...existing]); // append-only (newest first)
}

export function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}
