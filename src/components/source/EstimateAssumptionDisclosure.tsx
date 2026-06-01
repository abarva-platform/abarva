type Tone = "light" | "warning";

interface EstimateAssumptionDisclosureProps {
  title?: string;
  basis: string;
  assumptions: string[];
  caveat?: string;
  tone?: Tone;
}

const TONE_STYLE: Record<Tone, { bg: string; border: string; title: string; body: string }> = {
  light: {
    bg: "rgba(12,26,58,0.035)",
    border: "rgba(12,26,58,0.12)",
    title: "#0C1A3A",
    body: "#5A5148",
  },
  warning: {
    bg: "rgba(245,197,74,0.12)",
    border: "rgba(180,83,9,0.20)",
    title: "#7C4A04",
    body: "#5F4103",
  },
};

export function EstimateAssumptionDisclosure({
  title = "Estimate basis",
  basis,
  assumptions,
  caveat = "Directional estimate only; validate against signed pricing, scope, utilization, and finance-approved baseline before relying on it.",
  tone = "warning",
}: EstimateAssumptionDisclosureProps) {
  const style = TONE_STYLE[tone];

  return (
    <section
      data-testid="source-estimate-assumption-disclosure"
      data-source-estimate-disclosure="true"
      aria-label={title}
      style={{
        marginTop: 14,
        padding: "10px 12px",
        borderRadius: 8,
        background: style.bg,
        border: `1px solid ${style.border}`,
        fontFamily: "DM Sans, -apple-system, sans-serif",
        color: style.body,
      }}
    >
      <div
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: style.title,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 11, lineHeight: 1.55 }}>
        {basis}
      </p>
      <ul style={{ margin: "0 0 8px", paddingLeft: 18, fontSize: 11, lineHeight: 1.55 }}>
        {assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>
      <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5, fontStyle: "italic" }}>
        {caveat}
      </p>
    </section>
  );
}
