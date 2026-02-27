/* ==========================================================
   OUTFLO — VERIFY FORWARDING APERTURE (CLIENT)
   File: app/account/verify-forwarding/verify-forwarding.client.tsx
   Scope: Poll forwarding verification status; render 6-digit code; copy-and-close; exit on lock/expiry
   ========================================================== */

/* ------------------------------
   Imports
-------------------------------- */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------
   Types
-------------------------------- */
type PollStatus =
  | "waiting"
  | "found"
  | "locked"
  | "expired"
  | "closed"
  | "unauthorized"
  | "read_failed"
  | "ingest_read_failed"
  | "service_unavailable";

type PollResponse = {
  status: PollStatus;
  code?: string;
};

/* ------------------------------
   Constants
-------------------------------- */
const POLL_MS = 2000;

/* ------------------------------
   Helpers
-------------------------------- */
async function getJson(url: string): Promise<PollResponse> {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (res.status === 401) return { status: "unauthorized" };
  if (!res.ok) return { status: "read_failed" };

  const json = (await res.json()) as any;
  const status =
    typeof json?.status === "string" ? (json.status as PollStatus) : "read_failed";
  const code = typeof json?.code === "string" ? json.code : undefined;

  return { status, code };
}

async function postJson(url: string): Promise<{ ok: boolean }> {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return { ok: res.ok };
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------
   Component
-------------------------------- */
export default function VerifyForwardingClient() {
  const router = useRouter();

  const [status, setStatus] = useState<PollStatus>("waiting");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const tick = async () => {
      if (stoppedRef.current) return;

      const r = await getJson("/api/forwarding/poll");
      setStatus(r.status);

      if (r.status === "found" && r.code) {
        setCode(r.code);
        return;
      }

      if (
        r.status === "locked" ||
        r.status === "expired" ||
        r.status === "closed" ||
        r.status === "unauthorized"
      ) {
        router.replace("/account/profile");
        return;
      }
    };

    tick();

    timerRef.current = window.setInterval(() => {
      tick();
    }, POLL_MS);

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [router]);

  const onCopyAndClose = async () => {
    if (!code) return;

    const okCopy = await copyToClipboard(code);
    setCopied(okCopy);

    await postJson("/api/forwarding/close");
    router.replace("/account/profile");
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        Verify Forwarding
      </div>

      {!code && (
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          Waiting for Gmail forwarding confirmation…
        </div>
      )}

      {code && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>6-digit code:</div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 6,
              marginBottom: 12,
              userSelect: "text",
            }}
          >
            {code}
          </div>

          <button
            onClick={onCopyAndClose}
            style={{
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Copy (and close)
          </button>

          {copied && (
            <div style={{ fontSize: 12, marginTop: 10, opacity: 0.75 }}>
              Copied.
            </div>
          )}
        </div>
      )}

      {status !== "waiting" && status !== "found" && !code && (
        <div style={{ fontSize: 12, marginTop: 12, opacity: 0.7 }}>
          Status: {status}
        </div>
      )}
    </div>
  );
}