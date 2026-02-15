"use client";

import Link from "next/link";

/* --- constants --- */

const GLOW = "#FFFEFA";

/* --- component --- */

export default function EnginePage() {
  return (
    <main style={wrap}>
      <div style={frame}>
        {/* --- WHAT IT IS --- */}
        <section style={section}>
          <Title>What It Is</Title>

          <p style={p}>
            Outflō does not predict.
            <br />
            It records.
          </p>

          <p style={p}>
            Every receipt is anchored to epoch time.
            <br />
            The system runs continuously.
          </p>
        </section>

        <Divider />

        {/* --- HOW TIME WORKS --- */}
        <section style={section}>
          <Title>How Time Works</Title>

          <ul style={list}>
            <li>Unix epoch (machine time)</li>
            <li>Your epoch (system start)</li>
            <li>Day boundary (local midnight)</li>
          </ul>
        </section>

        <Divider />

        {/* --- WHY IT MATTERS --- */}
        <section style={section}>
          <Title>Why It Matters</Title>

          <p style={p}>
            The Engine does not advise.
            <br />
            It reveals.
          </p>

          <p style={p}>
            You are the boundary.
            <br />
            The system only records what leaves you.
          </p>
        </section>

        <Divider />

        {/* --- LINK --- */}
        <section style={{ ...section, paddingBottom: 32 }}>
          <Link href="/365/time" style={link}>
            View the running clock →
          </Link>
        </section>
      </div>
    </main>
  );
}

/* --- helpers --- */

function Title({ children }: { children: string }) {
  return <div style={title}>{children}</div>;
}

function Divider() {
  return <div style={divider} />;
}

/* --- styles --- */

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "black",
  color: "white",
  display: "grid",
  placeItems: "start center",
  padding: "max(22px, 6vh) 18px",
};

const frame: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  boxSizing: "border-box",
};

const section: React.CSSProperties = {
  display: "grid",
  gap: 14,
  padding: "10px 0",
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 650,
  letterSpacing: "-0.01em",
  opacity: 0.92,
};

const p: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.5,
  opacity: 0.82,
};

const list: React.CSSProperties = {
  display: "grid",
  gap: 8,
  paddingLeft: 18,
  fontSize: 15,
  opacity: 0.82,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.10)",
  margin: "18px 0",
};

const link: React.CSSProperties = {
  fontSize: 14,
  color: GLOW,
  textDecoration: "underline",
  textUnderlineOffset: 4,
  opacity: 0.95,
};
