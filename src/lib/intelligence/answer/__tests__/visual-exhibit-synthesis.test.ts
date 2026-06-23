import {
  extractMarkdownTableCandidate,
  missingRequestedVisual,
} from "@/lib/intelligence/answer/visual-exhibit-synthesis";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type { StructuredExhibits } from "@/lib/intelligence/answer/structured-exhibits";

const routing: RoutingDecision = {
  query: "Show this as a chart",
  experts: [],
  outputShape: "chart",
  scores: [],
};

const emptyExhibits: StructuredExhibits = {
  prose: "Read: answer",
  citations: [],
  tables: [],
  charts: [],
  graphs: [],
};

describe("visual exhibit synthesis helpers", () => {
  it("detects missing requested charts and graphs only", () => {
    expect(missingRequestedVisual(routing, emptyExhibits)).toBe(true);
    expect(
      missingRequestedVisual(
        { ...routing, outputShape: "graph" },
        emptyExhibits,
      ),
    ).toBe(true);
    expect(
      missingRequestedVisual(
        { ...routing, outputShape: "table" },
        emptyExhibits,
      ),
    ).toBe(false);
    expect(
      missingRequestedVisual(routing, {
        ...emptyExhibits,
        charts: [
          {
            id: "c1",
            kind: "cost-stack",
            data: [],
          },
        ],
      }),
    ).toBe(false);
  });

  it("extracts a single markdown table from model text", () => {
    expect(
      extractMarkdownTableCandidate(
        [
          "Here is the data:",
          "",
          "| Label | Value | Evidence |",
          "|---|---:|---|",
          "| Forecasting | 51 | cited row |",
          "| Lakehouse | 95 | cited row |",
          "",
          "Done.",
        ].join("\n"),
      ),
    ).toBe(
      [
        "| Label | Value | Evidence |",
        "|---|---:|---|",
        "| Forecasting | 51 | cited row |",
        "| Lakehouse | 95 | cited row |",
      ].join("\n"),
    );
  });

  it("rejects prose without a complete markdown table", () => {
    expect(
      extractMarkdownTableCandidate("Forecasting is $51M and lakehouse is $95M."),
    ).toBeNull();
  });
});
