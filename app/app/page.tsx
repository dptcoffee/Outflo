// app/app/page.tsx
import Link from "next/link";

export default function IdentityPage() {
  return (
    <main style={{ minHeight: "100svh", background: "black", color: "white", padding: 24 }}>
      <div style={{ opacity: 0.7, fontSize: 13 }}>Outflō</div>

      {/* placeholder: your ring + clock will live here */}
      <div style={{ marginTop: 28, fontSize: 32, fontWeight: 700 }}>Identity</div>
      <div style={{ marginTop: 10, opacity: 0.6 }}>Clock + ring live here (later)</div>

      <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
        <Link href="/app/systems" style={{ color: "white" }}>Systems →</Link>
        <Link href="/app/profile" style={{ color: "white", opacity: 0.8 }}>Profile →</Link>
      </div>
    </main>
  );
}

