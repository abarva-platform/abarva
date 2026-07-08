import { renderAvaAnswerStandaloneHtml } from "@/lib/ava-answer/export/render-answer-html";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

function answerFixture(): AvaAnswerPacket {
  return {
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: "lakeshore-holdings",
    question:
      "Give me the top 5 AI use cases for supply chain in a 2x2 value/complexity matrix.",
    intent: "chart",
    status: "answered",
    directAnswer:
      "The strongest near-term supply chain bets are demand sensing and supplier risk sensing.",
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [
      {
        artifact: "chart",
        id: "supply-chain-matrix",
        kind: "quadrant-matrix",
        title: "Supply Chain AI Matrix",
        data: {
          points: [
            { label: "Demand sensing", x: 52, y: 78 },
            { label: "Supplier risk sensing", x: 24, y: 52 },
          ],
        },
      },
      {
        artifact: "table",
        id: "use-case-table",
        title: "Ranked Use Cases",
        columns: [
          { key: "use_case", label: "Use case" },
          { key: "value_usd", label: "Value", format: "currency" },
        ],
        rows: [{ use_case: "Demand sensing", value_usd: 12500000 }],
      },
    ],
    tables: [],
    charts: [],
    graphs: [],
    citations: [],
    gaps: [],
    caveats: [],
    nextSteps: [],
    quality: {
      confidence: "high",
      evidenceStrength: "partial",
      tenantGrounding: "partial",
      answerCompleteness: "complete",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
}

describe("renderAvaAnswerStandaloneHtml", () => {
  it("preserves prose, typed SVG charts, and formatted table values", () => {
    const html = renderAvaAnswerStandaloneHtml(answerFixture());

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Supply Chain AI Matrix");
    expect(html).toContain("<svg");
    expect(html).toContain("Quick wins");
    expect(html).toContain("Demand sensing");
    expect(html).toContain("$12.5M");
    expect(html).not.toContain("12500000");
  });
});
