// app/state/page.tsx
export default function State() {
  // v0 wiring — hard numbers to prove the seam
  const todaysGain = 18.75;
  const rolling365 = 1243.92;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        display: "grid",
        gridTemplateRows: "1fr auto 2fr",
        placeItems: "center",
        padding: "max(24px, 6vh) 24px",
      }}
    >
      <section
        style={{
          width: "min(640px, 92vw)",
          display: "grid",
          rowGap: "clamp(44px, 7vh, 72px)",
        }}
      >
        {/* Number 1 */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Today’s Gain</div>
          <div
            style={{
              fontSize: "clamp(52px, 7vw, 76px)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(todaysGain >= 0 ? "+" : "-") + "$" + Math.abs(todaysGain).toFixed(2)}
          </div>
        </div>

        {/* Number 2 */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <div style={{ fontSize: 13, opacity: 0.55 }}>Rolling 365</div>
          <div
            style={{
              fontSize: "clamp(40px, 5.5vw, 58px)",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {"$" + rolling365.toFixed(2)}
          </div>
        </div>
      </section>
    </main>
  );
}
