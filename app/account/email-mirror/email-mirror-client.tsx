"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PollResp =
  | { open: true; found: false }
  | { open: true; found: true; code: string }
  | { open: false; expired: true }
  | { locked: true };

export default function EmailMirrorClient() {
  const router = useRouter();
  const [nonce, setNonce] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "polling" | "expired" | "locked">("idle");

  // Optional: if user lands here directly, prompt them to open from Profile
  async function openWindow() {
    const r = await fetch("/api/email-mirror/open", {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return;
    const j = await r.json();
    setNonce(j.nonce);
    setState("polling");
  }

  useEffect(() => {
    if (!nonce) return;

    let alive = true;

    const tick = async () => {
      try {
        const r = await fetch(`/api/email-mirror/poll?nonce=${encodeURIComponent(nonce)}`, {
          cache: "no-store",
        });

        if (r.status === 403) {
          const j = await r.json().catch(() => ({}));
          if (j?.locked) setState("locked");
          else setState("expired");
          alive = false;
          return;
        }

        const j: PollResp = await r.json();

        if ("open" in j && j.open && "found" in j && j.found && "code" in j) {
          setCode(j.code);
          alive = false;
        }
      } catch {
        // ignore transient
      }
    };

    tick();
    const i = setInterval(() => {
      if (alive) tick();
    }, 2000);

    return () => clearInterval(i);
  }, [nonce]);

  async function copyAndClose() {
    if (!code || !nonce) return;

    await navigator.clipboard.writeText(code);

    await fetch("/api/email-mirror/close", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ nonce }),
    });

    router.replace("/account/profile");
  }

  return (
    <main style={{ minHeight: "100svh", background: "black", color: "white", padding: "max(28px, 6vh) 24px" }}>
      <div style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 14 }}>email mirror</div>
        <div style={{ fontSize: 22, fontWeight: 650, marginBottom: 8 }}>Verification</div>

        {!nonce && (
          <button
            onClick={openWindow}
            style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, borderRadius: 12 }}
          >
            Open 2-minute window
          </button>
        )}

        {state === "polling" && !code && <div style={{ marginTop: 12, opacity: 0.8 }}>Waiting for Gmail confirmation email…</div>}
        {state === "expired" && <div style={{ marginTop: 12, opacity: 0.8 }}>Window closed. Go back and re-open.</div>}
        {state === "locked" && <div style={{ marginTop: 12, opacity: 0.8 }}>Already verified.</div>}

        {code && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 28, letterSpacing: 2 }}>{code}</div>
            <button
              onClick={copyAndClose}
              style={{ marginTop: 12, padding: "10px 14px", fontSize: 14, fontWeight: 700, borderRadius: 12 }}
            >
              Copy (and close)
            </button>
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <Link href="/account/profile" style={{ color: "white", opacity: 0.8, textDecoration: "none" }}>
            Back to Profile
          </Link>
        </div>
      </div>
    </main>
  );
}