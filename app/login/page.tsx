"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMsg(null);

    const supabase = supabaseBrowser();

    // ✅ ALWAYS return to callback without next params
    const emailRedirectTo =
      typeof window === "undefined"
        ? undefined
        : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    if (error) setMsg(error.message);
    else setSent(true);

    setBusy(false);
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Sign in</h1>
        <p style={{ opacity: 0.7, marginTop: 10 }}>
          We’ll email you a magic link.
        </p>

        {sent ? (
          <div style={{ marginTop: 18, opacity: 0.9 }}>
            Magic link sent. Check your email.
          </div>
        ) : (
          <form onSubmit={sendLink} style={{ marginTop: 18 }}>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                padding: "0 14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                outline: "none",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              style={{
                width: "100%",
                height: 48,
                marginTop: 12,
                borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "white",
                fontSize: 14,
                cursor: busy ? "default" : "pointer",
              }}
            >
              {busy ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        {msg && <div style={{ marginTop: 12, color: "#ff9a9a" }}>{msg}</div>}
      </div>
    </main>
  );
}




