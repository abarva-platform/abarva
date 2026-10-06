export function SourceWorkspaceLoadingShell({
  contractId,
}: {
  readonly contractId?: string | null;
}) {
  const openingContract = Boolean(contractId?.trim());
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
          {openingContract
            ? "Opening Contract 360."
            : "Opening Source command center."}
        </h1>
        <p
          style={{
            margin: "10px 0 26px",
            color: "#5f5e5a",
            fontSize: 14,
            maxWidth: 1120,
            lineHeight: 1.55,
          }}
        >
          {openingContract
            ? `Restoring ${contractId} in the governed Source workspace. The selected contract and tab will remain stable through refresh.`
            : "Opening portfolio rows and vendor rollups first. Evidence coverage and action candidates hydrate after the executive view is visible."}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
            gap: 6,
            borderBottom: "1px solid rgba(211,209,199,.72)",
            background: "#f5f1eb",
            maxWidth: "100%",
            overflowX: "auto",
            padding: "14px 0 12px",
          }}
        >
          {["Command", "Contracts", "Levers", "Evidence", "Coverage"].map(
            (label) => (
              <div
                key={label}
                style={{
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  padding: "0 10px",
                  background: label === "Command" ? "#0f6e56" : "#f1efe8",
                  color: label === "Command" ? "#fff" : "#5f5e5a",
                  fontWeight: label === "Command" ? 700 : 500,
                  textAlign: "center",
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: 12,
            maxWidth: 920,
            width: "100%",
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
