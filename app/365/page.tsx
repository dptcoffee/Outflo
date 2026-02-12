import Link from "next/link";

export default function ThreeSixFiveMenu() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: "max(24px, 6vh) 24px",
      }}
    >
      <section
        style={{
          width: "min(520px, 92vw)",
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.55 }}>365</div>

        <MenuLink href="/365/money" label="Money" />
        <MenuLink href="/time" label="Time" />
        <MenuLink href="/calculate" label="Calculate" />
      </section>
    </main>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "white",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        padding: "18px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 16,
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.35 }}>→</span>
    </Link>
  );
}




