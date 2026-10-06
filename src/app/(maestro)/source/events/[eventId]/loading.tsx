const PHASES = ["Request", "Define", "Suppliers & NDA", "Market package"] as const;

export default function SourceEventLoading() {
  return (
    <section
      aria-label="Source New event is preparing"
      style={{
        minHeight: "100%",
        background: "#fbfaf7",
        color: "#0a0a0b",
        padding: "28px 40px 48px",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          color: "#0a7c63",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        Source New
      </p>
      <h1
        style={{
          margin: 0,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: 0,
          lineHeight: 1.1,
        }}
      >
        Opening the governed event.
      </h1>
      <p
        style={{
          margin: "10px 0 28px",
          color: "#5f5e5a",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        Loading the event stage, files, intelligence, and approval trail.
      </p>

      <div
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
          gap: 0,
          borderTop: "1px solid rgba(10,10,11,.16)",
          borderBottom: "1px solid rgba(10,10,11,.16)",
          overflowX: "auto",
        }}
      >
        {PHASES.map((phase, index) => (
          <div
            key={phase}
            style={{
              minHeight: 68,
              borderRight:
                index < PHASES.length - 1
                  ? "1px solid rgba(10,10,11,.12)"
                  : undefined,
              padding: "15px 18px",
            }}
          >
            <span
              style={{
                color: "#8a8984",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div style={{ marginTop: 7, fontSize: 13, fontWeight: 700 }}>
              {phase}
            </div>
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        style={{
          marginTop: 36,
          display: "grid",
          gap: 14,
          maxWidth: 840,
        }}
      >
        {["34%", "78%", "58%"].map((width) => (
          <div
            key={width}
            style={{
              width,
              height: 12,
              background: "rgba(10,10,11,.1)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
