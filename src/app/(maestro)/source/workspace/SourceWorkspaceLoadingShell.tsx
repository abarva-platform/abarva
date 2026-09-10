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
      <nav
        aria-label="Main application navigation"
        style={{
          minHeight: 64,
          background: "#08080b",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 32px",
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
            paddingLeft: 18,
            borderLeft: "1px solid rgba(255,255,255,.18)",
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 14,
            fontStyle: "italic",
            fontWeight: 520,
            color: "rgba(255,255,255,.82)",
          }}
        >
          {tenantName}
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {["Home", "Intelligence", "Moves", "Source", "Tower"].map((label) => (
            <a
              key={label}
              href={
                label === "Home"
                  ? "/home"
                  : label === "Moves"
                    ? "/strategic-moves"
                    : `/${label.toLowerCase()}`
              }
              aria-current={label === "Source" ? "page" : undefined}
              style={{
                minHeight: 36,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: label === "Source" ? "#fff" : "transparent",
                color: label === "Source" ? "#0a0a0b" : "rgba(255,255,255,.68)",
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 760,
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
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
          Preparing Source command center.
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
          Opening portfolio rows and vendor rollups first. Evidence coverage and
          action candidates hydrate after the executive view is visible.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(112px, 1fr))",
            gap: 24,
            borderBottom: "1px solid rgba(10,10,11,.22)",
            background: "#f5f1eb",
            maxWidth: 1280,
          }}
        >
          {["Command", "Contracts", "Levers", "Evidence", "Coverage"].map(
            (label) => (
              <div
                key={label}
                style={{
                  minHeight: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid transparent",
                  borderBottom: 0,
                  borderRadius: "8px 8px 0 0",
                  padding: "0 14px",
                  background: label === "Command" ? "#e1f5ee" : "transparent",
                  color: label === "Command" ? "#0f6e56" : "#0a0a0b",
                  fontWeight: 800,
                  textAlign: "center",
                  boxShadow:
                    label === "Command" ? "inset 0 -3px 0 #1d9e75" : "none",
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
