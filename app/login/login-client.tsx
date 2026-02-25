"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Mode = "signin" | "signup" | "reset";

export default function LoginClient() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMsg(null);

    const supabase = supabaseBrowser();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // If sign-in succeeds, server /login will redirect to /app on next render.
        // But we can also hard-navigate client-side for immediacy:
        window.location.href = "/";
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        setMsg("Account created. You can sign in now.");
        setMode("signin");
        setPassword("");
        return;
      }

      // reset
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;

      setMsg("Password reset email sent. Check your inbox.");
      return;
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
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
        <h1 style={{ margin: 0, fontSize: 28 }}>
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>

        <p style={{ opacity: 0.7, marginTop: 10 }}>
          {mode === "reset"
            ? "We’ll email you a reset link."
            : "Email + password."}
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
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

          {mode !== "reset" && (
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                padding: "0 14px",
                marginTop: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                outline: "none",
                fontSize: 14,
              }}
            />
          )}

          <button
            type="submit"
            disabled={
              busy ||
              !email.trim() ||
              (mode !== "reset" && !password.trim())
            }
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
            {busy
              ? "Working…"
              : mode === "signin"
              ? "Sign in"
              : mode === "signup"
              ? "Create account"
              : "Send reset email"}
          </button>
        </form>

        <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {mode !== "signin" && (
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setMode("signin");
              }}
              style={linkBtn}
            >
              Sign in
            </button>
          )}

          {mode !== "signup" && (
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setMode("signup");
              }}
              style={linkBtn}
            >
              Create account
            </button>
          )}

          {mode !== "reset" && (
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setMode("reset");
                setPassword("");
              }}
              style={linkBtn}
            >
              Forgot password
            </button>
          )}
        </div>

        {msg && <div style={{ marginTop: 12, color: "#ff9a9a" }}>{msg}</div>}
      </div>
    </main>
  );
}

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  color: "rgba(255,255,255,0.75)",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: 13,
};
