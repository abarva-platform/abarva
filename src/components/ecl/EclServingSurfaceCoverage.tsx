const SURFACE_LABELS = {
  home: [
    "Executive Brief",
    "Our Business",
    "Strategy & Value Creation",
    "How We Operate",
    "Technology & Data",
    "Performance & Value",
    "Leadership Perspective",
    "What Needs Attention",
    "Current-state architecture",
    "Current-state data flow",
    "What has been loaded",
    "Browse the record",
    "Applications & Systems",
    "Vendor Contracts",
    "Infrastructure & Platforms",
    "Data Assets & Integrations",
  ],
  source: [
    "Vendor portfolio",
    "Vendor 360",
    "Contract 360",
    "Renewal",
    "Events",
    "Compare",
    "Value Levers",
    "Approvals",
    "Sourcing Opportunities",
  ],
  tower: [
    "Executive View",
    "Value Proof",
    "AI Portfolio",
    "Evidence & Actions",
    "Cost Lens",
    "Risk Lens",
    "Adoption Lens",
  ],
  intelligence: [
    "Advisory",
    "Enterprise Landscape",
    "Ask query",
    "Insights & Evaluate",
    "Pattern Detail",
    "Context Summary",
  ],
} as const;

type EclServingProduct = keyof typeof SURFACE_LABELS;

const PRODUCT_TONES: Record<
  EclServingProduct,
  { border: string; background: string; ink: string; chip: string }
> = {
  home: {
    border: "rgba(29, 78, 216, 0.18)",
    background: "rgba(239, 246, 255, 0.78)",
    ink: "#1e40af",
    chip: "rgba(219, 234, 254, 0.78)",
  },
  source: {
    border: "rgba(15, 23, 42, 0.16)",
    background: "rgba(255, 255, 255, 0.82)",
    ink: "#0f172a",
    chip: "rgba(241, 245, 249, 0.92)",
  },
  tower: {
    border: "rgba(5, 122, 85, 0.2)",
    background: "rgba(248, 255, 251, 0.9)",
    ink: "#057a55",
    chip: "rgba(214, 234, 223, 0.52)",
  },
  intelligence: {
    border: "rgba(4, 120, 87, 0.18)",
    background: "rgba(240, 253, 244, 0.72)",
    ink: "#047857",
    chip: "rgba(220, 252, 231, 0.68)",
  },
};

export function EclServingSurfaceCoverage({
  product,
}: {
  product: EclServingProduct;
}) {
  const labels = SURFACE_LABELS[product];
  const tone = PRODUCT_TONES[product];

  return (
    <section
      aria-label={`${product} ECL serving surface coverage`}
      style={{
        border: `1px solid ${tone.border}`,
        background: tone.background,
        padding: 14,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <p
          style={{
            color: tone.ink,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".16em",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Serving surfaces
        </p>
        <span
          style={{
            color: "#334155",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          {labels.length}/{labels.length}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
        }}
      >
        {labels.map((label) => (
          <span
            key={label}
            style={{
              background: tone.chip,
              border: `1px solid ${tone.border}`,
              color: "#111827",
              fontSize: 12,
              fontWeight: 650,
              lineHeight: 1,
              padding: "7px 9px",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
