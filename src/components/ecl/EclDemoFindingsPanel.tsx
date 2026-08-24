type EclDemoFindingProduct = "home" | "source" | "tower" | "intelligence";

type EclDemoFinding = {
  id: string;
  product: EclDemoFindingProduct;
  surface: string;
  claim: string;
};

const FINDINGS: EclDemoFinding[] = [
  {
    id: "F1",
    product: "source",
    surface: "Vendor portfolio and opportunities",
    claim: "Three suppliers deliver the same capability to one business function.",
  },
  {
    id: "F1",
    product: "tower",
    surface: "Cost lens",
    claim: "Three suppliers deliver the same capability to one business function.",
  },
  {
    id: "F2",
    product: "source",
    surface: "Renewal and Contract 360",
    claim: "A contract auto-renews inside the window with no way to stop it.",
  },
  {
    id: "F3",
    product: "source",
    surface: "Contract 360 and value",
    claim: "A cohort of contracts protects the vendor, not the client.",
  },
  {
    id: "F3",
    product: "tower",
    surface: "Cost lens",
    claim: "A cohort of contracts protects the vendor, not the client.",
  },
  {
    id: "F4",
    product: "home",
    surface: "Applications and Technology & Data",
    claim: "One function runs five or more applications in the same subdomain from three or more vendors.",
  },
  {
    id: "F4",
    product: "tower",
    surface: "Cost lens",
    claim: "One function runs five or more applications in the same subdomain from three or more vendors.",
  },
  {
    id: "F5",
    product: "home",
    surface: "Data assets",
    claim: "The same workload runs on four or more BI technologies, including one ungoverned row.",
  },
  {
    id: "F5",
    product: "intelligence",
    surface: "Landscape",
    claim: "The same workload runs on four or more BI technologies, including one ungoverned row.",
  },
  {
    id: "F6",
    product: "home",
    surface: "Infrastructure and architecture",
    claim: "A clinical function depends on an appliance losing vendor support.",
  },
  {
    id: "F6",
    product: "tower",
    surface: "Risk lens",
    claim: "A clinical function depends on an appliance losing vendor support.",
  },
  {
    id: "F7",
    product: "home",
    surface: "Performance & Value",
    claim: "Unattributed spend is rendered as a named gap, never as zero.",
  },
  {
    id: "F7",
    product: "tower",
    surface: "Cost lens",
    claim: "Unattributed spend is rendered as a named gap, never as zero.",
  },
  {
    id: "F8",
    product: "tower",
    surface: "Value proof and evidence",
    claim: "Material value is gated, and every gated claim says why.",
  },
  {
    id: "F9",
    product: "source",
    surface: "Vendor 360",
    claim: "Open control exceptions cluster on one vendor's estate.",
  },
  {
    id: "F9",
    product: "tower",
    surface: "Risk lens",
    claim: "Open control exceptions cluster on one vendor's estate.",
  },
  {
    id: "F10",
    product: "home",
    surface: "Current-state data flow",
    claim: "End-to-end data flow is correctly refused when topology evidence cannot answer the question.",
  },
];

export function EclDemoFindingsPanel({
  product,
}: {
  product: EclDemoFindingProduct;
}) {
  const findings = FINDINGS.filter((finding) => finding.product === product);
  if (findings.length === 0) return null;

  return (
    <section
      aria-label="ECL demo findings on this surface"
      className="border-b border-slate-200 bg-white/90 px-6 py-5 text-slate-950"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Demo findings on this surface
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Evidence the dense record can explain, not just count
            </h2>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            {findings.length} checks visible
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {findings.map((finding) => (
            <article
              key={`${finding.product}:${finding.id}:${finding.surface}`}
              className="border border-slate-200 bg-slate-50/70 p-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                  {finding.id}
                </p>
                <p className="text-right text-[11px] font-medium text-slate-500">
                  {finding.surface}
                </p>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-800">
                {finding.claim}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
