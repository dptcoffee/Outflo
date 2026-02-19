// app/app/profile/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");

  return (
    <main style={{ minHeight: "100svh", background: "black", color: "white", padding: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Profile</div>
      <div style={{ marginTop: 12, opacity: 0.7 }}>{data.user.email}</div>
      <div style={{ marginTop: 24, opacity: 0.6 }}>Password reset + logout later.</div>
    </main>
  );
}
