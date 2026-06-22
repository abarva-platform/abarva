import { buildStructuredExhibits } from "@/lib/intelligence/answer/structured-exhibits";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type { AskSource } from "@/lib/intelligence/ask/types";

const routing: RoutingDecision = {
  query: "Show me a chart of Epic spend by category",
  experts: [
    {
      id: "xp.healthcare.revenue-cycle",
      name: "Healthcare Revenue Cycle Expert",
    },
  ],
  outputShape: "chart",
  scores: [],
};

const sources: AskSource[] = [
  {
    id: "chunk-1",
    type: "TENANT",
    name: "F12 IT budget",
    detail: "Epic maintenance and integration spend records.",
    confidence: 0.8,
  },
];

describe("buildStructuredExhibits", () => {
  it("does not infer chart data from figures mentioned in prose", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Epic maintenance is $1.2M for the current run baseline. Epic integration work is $350K for the roadmap tranche.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.tables[0]?.title).toBe("Evidence Used");
    expect(exhibits.charts).toHaveLength(0);
  });

  it("renders an evidence table for table-shaped questions with cited sources even without extractable figures", () => {
    const exhibits = buildStructuredExhibits({
      routing: { ...routing, outputShape: "table" },
      sources,
      prose:
        "The right breakdown is denial reason category, AR days, and overturn rate. Next move: ask Revenue Cycle Operations to validate the category extract from the evidence ledger.",
    });

    expect(exhibits.tables[0]?.title).toBe("Evidence Used");
    expect(exhibits.tables[0]?.rows).toEqual([
      expect.objectContaining({ source: "F12 IT budget" }),
    ]);
    expect(exhibits.charts).toHaveLength(0);
  });

  it("renders cited evidence for chart requests without inventing chart rows", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources: [
        {
          id: "surface-denials",
          type: "SURFACE",
          name: "Revenue cycle denial chart support",
          detail:
            "Medical necessity leakage exposure is $1.2M. Prior authorization leakage exposure is $650K. Eligibility leakage exposure is $310K.",
          confidence: 0.92,
        },
      ],
      prose:
        "Medical Necessity is the highest-priority investment target. Prior Authorization is second, and Eligibility should be handled as a cleanup lane.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.citations[0]?.sourceClass).toBe("tenant-fact");
    expect(exhibits.tables[0]?.title).toBe("Evidence Used");
    expect(exhibits.tables[0]?.rows).toEqual([
      expect.objectContaining({ source: "Revenue cycle denial chart support" }),
    ]);
    expect(exhibits.charts).toHaveLength(0);
  });

  it("converts complete markdown tables from Ava prose into typed tables", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose: [
        "Here are planning ranges from the cited context.",
        "",
        "| Use case | Primary benefit | Range |",
        "|---|---|---|",
        "| Demand forecasting | Inventory turn | 2-5% margin lift |",
        "| Markdown optimization | Recovered margin | 1-2% category margin |",
        "",
        "Next move: validate tenant-specific numbers before board use.",
      ].join("\n"),
    });

    expect(exhibits.prose).toContain(
      "Here are planning ranges from the cited context.",
    );
    expect(exhibits.prose).toContain(
      "Next move: validate tenant-specific numbers before board use.",
    );
    expect(exhibits.prose).not.toContain("| Use case |");
    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "answer-markdown-table-1",
        title: "Answer Table",
        rows: [
          expect.objectContaining({
            use_case: "Demand forecasting",
            primary_benefit: "Inventory turn",
            range: "2-5% margin lift",
          }),
          expect.objectContaining({
            use_case: "Markdown optimization",
            primary_benefit: "Recovered margin",
            range: "1-2% category margin",
          }),
        ],
      }),
    );
    expect(exhibits.charts).toHaveLength(0);
  });

  it("converts collapsed inline markdown tables from live Ava prose into typed tables", () => {
    const exhibits = buildStructuredExhibits({
      routing: { ...routing, outputShape: "table" },
      sources,
      prose:
        "Here's the visual cut. Omnichannel dependency risk — ranked | System | Annual cost | Integrations | Posture | Risk driver | |---|---|---|---|---| | IBM Sterling OMS | $22M/yr | 10 | Contain | Routing ship-from-store | | Toshiba POS | $23M/yr | 11 | Replace | Store-edge transition | The single chart that matters is dependency concentration.",
    });

    expect(exhibits.prose).toContain("Here's the visual cut.");
    expect(exhibits.prose).toContain(
      "The single chart that matters is dependency concentration.",
    );
    expect(exhibits.prose).not.toContain("| System |");
    expect(exhibits.tables[0]).toEqual(
      expect.objectContaining({
        id: "answer-inline-table-1",
        title: "Answer Table",
        rows: [
          expect.objectContaining({
            system: "IBM Sterling OMS",
            annual_cost: "$22M/yr",
            integrations: "10",
            posture: "Contain",
            risk_driver: "Routing ship-from-store",
          }),
          expect.objectContaining({
            system: "Toshiba POS",
            annual_cost: "$23M/yr",
            integrations: "11",
            posture: "Replace",
            risk_driver: "Store-edge transition",
          }),
        ],
      }),
    );
    expect(exhibits.charts).toHaveLength(0);
  });

  it("renders a chart only from exact numeric columns in an extracted table", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Here's the visual cut. Omnichannel dependency risk — ranked | System | Annual cost | Integrations | Posture | Risk driver | |---|---|---|---|---| | IBM Sterling OMS | $22M/yr | 10 | Contain | Routing ship-from-store | | Toshiba POS | $23M/yr | 11 | Replace | Store-edge transition | | Salesforce Commerce | $12M/yr | 8 | Invest | Healthy posture | Next move: validate the risk owner.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toEqual([
      expect.objectContaining({
        id: "answer-table-chart-1",
        kind: "cost-stack",
        title: "Annual cost by System",
        data: [
          expect.objectContaining({ label: "IBM Sterling OMS", value: 22_000_000 }),
          expect.objectContaining({ label: "Toshiba POS", value: 23_000_000 }),
          expect.objectContaining({ label: "Salesforce Commerce", value: 12_000_000 }),
        ],
      }),
    ]);
  });

  it("does not chart directional ranges from an extracted table", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Merchandising AI benefit pools — planning ranges | Use case | Primary benefit | Planning range | Basis | |---|---|---|---| | Demand forecasting | Inventory turn | 2-5% margin lift | Apex evidence ledger | | Assortment optimization | SKU productivity | 3-8% margin lift | Corpus pattern | Next move: validate tenant-specific numbers.",
    });

    expect(exhibits.tables).toHaveLength(1);
    expect(exhibits.charts).toHaveLength(0);
  });

  it("does not infer percentage charts from cited source prose", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources: [
        {
          id: "surface-denial-rates",
          type: "SURFACE",
          name: "Revenue cycle denial rate support",
          detail:
            "Medical necessity denial rate is 11.8%. Prior authorization denial rate is 8.4%. Eligibility denial rate is 4.9%.",
          confidence: 0.92,
        },
      ],
      prose:
        "Medical necessity is the highest-priority investment target because the rate and AR drag are both worse than the other categories.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.tables[0]?.title).toBe("Evidence Used");
    expect(exhibits.charts).toHaveLength(0);
  });

  it("renders a truthful evidence-required table when a table is requested without enough cited rows", () => {
    const exhibits = buildStructuredExhibits({
      routing: { ...routing, outputShape: "table" },
      sources: [],
      prose:
        "The requested denial-category table is not in the connected tenant evidence. Next move: validate the source extract before approving numbers.",
    });

    expect(exhibits.tables[0]?.title).toBe("Evidence Required");
    expect(exhibits.tables[0]?.rows[0]).toEqual(
      expect.objectContaining({
        status: "No cited source available for the requested rows",
      }),
    );
  });
});
