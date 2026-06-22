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
