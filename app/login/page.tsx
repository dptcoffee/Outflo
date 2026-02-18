"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // If we arrive here with #access_token=...&refresh_token=... (implicit flow),
  // consume it client-side and persist the session, then redirect to `next`.
  useEffect(() => {
    async function consumeHashTokens() {
      if (typeof window === "undefined") return;

      const hash = window.location.hash?.startsWith("#")
        ? window.location.hash.slice(1)
        : "";

      if (!hash) return;

      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (!access_token || !refresh_token) return;

      const supabase = supabaseBrowser();

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      // Clean the URL (remove the hash tokens from address bar)
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );

      if (!error) {
        const next = new URLSearchParams(window.location.search).get("next") ?? "/";
        window.location.replace(next);
      } else {
        setMsg(error.message);
      }
    }

    consumeHashTokens();
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    setMsg(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setMsg(error.message);
    else setSent(true);

    setSending(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>Sign in</h1>

      {sent ? (
        <p>Magic link sent. Check your email.</p>
      ) : (
        <form onSubmit={sendLink}>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 12, marginTop: 12 }}
          />
          <button
            type="submit"
            disabled={sending}
            style={{ marginTop: 12, padding: 12 }}
          >
            {sending ? "Sending..." : "Send magic link"}
          </button>
        </form>
      )}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}


