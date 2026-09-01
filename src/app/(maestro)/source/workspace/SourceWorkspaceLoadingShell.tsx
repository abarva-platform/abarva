export function SourceWorkspaceLoadingShell({
  tenantName = "AbarVa Client",
}: {
  tenantName?: string;
}) {
  return (
    <section
      aria-label="Source 360 is preparing"
      style={{
        minHeight: "100%",
        background: "#f5f1eb",
        color: "#0a0a0b",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 56,
          background: "#0a0a0b",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 40px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 21,
            fontWeight: 600,
          }}
        >
          Abar<span style={{ color: "#2fbf8f" }}>Va</span>
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.62)",
          }}
        >
          Source 360
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.62)",
          }}
        >
          {tenantName}
        </span>
      </div>
      <div style={{ padding: "28px 40px 40px" }}>
        <p
          style={{
            margin: "0 0 8px",
            color: "#0a7c63",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Source 360
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
          Preparing the governed contract book.
        </h1>
        <p
          style={{
            margin: "10px 0 26px",
            color: "#5f5e5a",
            fontSize: 14,
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Loading portfolio rows, vendor rollups, action candidates, and
          evidence coverage before the executive view opens.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(112px, 1fr))",
            border: "1px solid rgba(10,10,11,.22)",
            borderBottom: "3px solid #0a0a0b",
            background: "#f5f1eb",
            maxWidth: 920,
          }}
        >
          {[
            "Verdict",
            "Vendors",
            "Contracts",
            "Optimize",
            "Evidence",
            "Contract graph",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "16px 18px",
                borderRight: "1px solid rgba(10,10,11,.22)",
                background: label === "Verdict" ? "#0a0a0b" : "#fff",
                color: label === "Verdict" ? "#fff" : "#5f5e5a",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: 12,
            maxWidth: 920,
          }}
        >
          {["Portfolio", "Evidence", "Actions"].map((label) => (
            <div
              key={label}
              style={{
                height: 92,
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 7,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,.95), rgba(255,255,255,.7))",
                padding: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  color: "#888780",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 18,
                  height: 10,
                  width: "72%",
                  borderRadius: 999,
                  background: "rgba(10,10,11,.12)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
