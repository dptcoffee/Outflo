import Link from "next/link";

export default function Calculate() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        padding: "max(24px, 6vh) 24px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section style={{ width: "min(760px, 94vw)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <Tile href="/state" label="Gain" />
          <Tile href="/merchant" label="Merchant365" />
        </div>
      </section>
    </main>
  );
}

function Tile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "white",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        padding: "22px 18px",
        minHeight: 120,
        display: "grid",
        alignContent: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 0.2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, opacity: 0.55, marginTop: 6 }}>
        Open
      </div>
    </Link>
  );
}

