import Link from "next/link";

export default function ThreeSixFiveMenu() {
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
        <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 14 }}>365</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <Tile href="/365/money" label="Money" />
          <Tile href="/time" label="Time" />

          {/* 3rd tile spans full width for symmetry */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Tile href="/calculate" label="Calculate" />
          </div>
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
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 22,
        padding: "22px 20px",
        height: 140,
        display: "grid",
        alignContent: "space-between",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 650 }}>{label}</div>
      <div style={{ fontSize: 13, opacity: 0.55 }}>Open</div>
    </Link>
  );
}





