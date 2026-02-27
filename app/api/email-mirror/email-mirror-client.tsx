"use client";

import { useEffect, useState } from "react";
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

  async function openWindow() {
    const r = await fetch("/api/email-mirror/open", { method: "POST" });
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
        // ignore, keep trying until window expires
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonce }),
    });

    router.replace("/account/profile");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Email Mirror — Verification</h2>

      {!nonce && (
        <button onClick={openWindow}>Enable Email Mirror</button>
      )}

      {state === "expired" && <p>Window closed. Re-open to try again.</p>}
      {state === "locked" && <p>Email Mirror already verified.</p>}

      {nonce && state === "polling" && !code && <p>Waiting for Gmail confirmation email…</p>}

      {code && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 28, letterSpacing: 2 }}>{code}</div>
          <button onClick={copyAndClose} style={{ marginTop: 12 }}>
            Copy (and close)
          </button>
        </div>
      )}
    </div>
  );
}