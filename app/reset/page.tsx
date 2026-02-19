"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ResetPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // Supabase client will detect recovery tokens in URL and set session automatically (default behavior).
    // We just wait a tick so the session can be established.
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMsg(null);

    const supabase = supabaseBrowser();

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMsg("This reset link is invalid or expired. Request a new one from /login.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setMsg("Password updated. Redirecting…");
    setTimeout(() => {
      window.location.href = "/app";
    }, 400);

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
        <h1 style={{ margin: 0, fontSize: 28 }}>Set new password</h1>
        <p style={{ opacity: 0.7, marginTop: 10 }}>
          {ready ? "Enter a new password." : "Loading…"}
        </p>

        <form onSubmit={setNewPassword} style={{ marginTop: 18 }}>
          <input
            type="password"
            placeholder="new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!ready || busy}
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
              opacity: !ready ? 0.6 : 1,
            }}
          />

          <button
            type="submit"
            disabled={!ready || busy || !password.trim()}
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
            {busy ? "Saving…" : "Save password"}
          </button>
        </form>

        {msg && <div style={{ marginTop: 12, color: "#ff9a9a" }}>{msg}</div>}

        <div style={{ marginTop: 16 }}>
          <a href="/login" style={{ color: "rgba(255,255,255,0.75)" }}>
            Back to login
          </a>
        </div>
      </div>
    </main>
  );
}
