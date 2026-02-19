import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "black",
        color: "white",
        padding: "max(28px, 6vh) 24px",
        display: "grid",
        alignContent: "start",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 14 }}>
          identity
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 650,
            marginBottom: 8,
          }}
        >
          Profile
        </div>

        <div
          style={{
            opacity: 0.75,
            marginBottom: 28,
          }}
        >
          {data.user.email}
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 20,
            padding: "18px 20px",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.6 }}>
            Password reset
          </div>
          <div style={{ marginTop: 6, fontSize: 14 }}>
            Coming soon
          </div>
        </div>

        <Link
          href="/logout"
          style={{
            display: "inline-block",
            marginTop: 20,
            fontSize: 14,
            opacity: 0.8,
            textDecoration: "none",
            color: "white",
          }}
        >
          Log out
        </Link>
      </div>
    </main>
  );
}

