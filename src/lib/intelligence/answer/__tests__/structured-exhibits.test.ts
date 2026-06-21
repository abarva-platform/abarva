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
  it("creates grounded tables and charts only from figures already in the answer", () => {
    const exhibits = buildStructuredExhibits({
      routing,
      sources,
      prose:
        "Epic maintenance is $1.2M for the current run baseline. Epic integration work is $350K for the roadmap tranche.",
    });

    expect(exhibits.citations).toHaveLength(1);
    expect(exhibits.tables[0]?.title).toBe("Figures Mentioned");
    expect(exhibits.tables[0]?.rows).toHaveLength(2);
    expect(exhibits.charts[0]?.kind).toBe("cost-stack");
    expect(exhibits.charts[0]?.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 1_200_000 }),
        expect.objectContaining({ value: 350_000 }),
      ]),
    );
  });
});
