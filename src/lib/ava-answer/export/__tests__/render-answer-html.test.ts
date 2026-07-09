import {
  renderAvaAnswerStandaloneHtml,
  renderAvaChatSessionStandaloneHtml,
} from "@/lib/ava-answer/export/render-answer-html";
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

  it("exports model-emitted chart fences after they are lifted to inlineChart artifacts", () => {
    const answer = answerFixture();
    answer.artifacts = [
      {
        artifact: "chart",
        id: "ai-adoption-trend",
        kind: "line",
        title: "AI adoption trend",
        builder: "inlineChart",
        data: {
          type: "line",
          title: "AI adoption trend",
          subtitle: "Back-office functions",
          xKey: "Year",
          yKey: "Adoption",
          unit: "%",
          data: [
            { Year: "2024", Adoption: 22 },
            { Year: "2025", Adoption: 41 },
            { Year: "2026", Adoption: 68 },
          ],
        },
      },
    ];

    const html = renderAvaAnswerStandaloneHtml(answer);

    expect(html).toContain("AI adoption trend");
    expect(html).toContain("Back-office functions");
    expect(html).toContain("<svg");
    expect(html).toContain("68%");
    expect(html).not.toContain("inlineChart");
  });

  it("does not leak raw markdown tables or chart JSON in HTML export prose", () => {
    const answer = answerFixture();
    answer.directAnswer = `Here is the table:

| Phase | Owner |
| --- | --- |
| P0 Originate | CFO |

\`\`\`chart
{"type":"bar","xKey":"Phase","yKey":"Value","data":[{"Phase":"P0","Value":1}]}
\`\`\`

Use the typed artifact if available.`;
    answer.artifacts = [];

    const html = renderAvaAnswerStandaloneHtml(answer);

    expect(html).not.toContain("| --- |");
    expect(html).not.toContain("```chart");
    expect(html).not.toContain('"type":"bar"');
    expect(html).toContain("table-shaped answer was detected");
    expect(html).toContain("chart-shaped answer was detected");
  });

  it("decodes basic escaped characters before export escaping", () => {
    const answer = answerFixture();
    answer.directAnswer = "Finance &amp; Procurement shouldn&#39;t see raw entities.";

    const html = renderAvaAnswerStandaloneHtml(answer);

    expect(html).toContain("Finance &amp; Procurement shouldn't");
    expect(html).not.toContain("&amp;amp;");
    expect(html).not.toContain("&amp;#39;");
  });

  it("exports a full chat session with prompts, governed answers, visuals, and evidence stats", () => {
    const html = renderAvaChatSessionStandaloneHtml({
      surface: "intelligence",
      tenantKey: "lakeshore-holdings",
      title: "Supply chain AI investment session",
      turns: [
        {
          id: "u1",
          role: "user",
          body: "Give me the top 5 supply chain AI bets.",
        },
        {
          id: "a1",
          role: "agent",
          body: "Demand sensing is the strongest near-term bet.",
          answer: {
            ...answerFixture(),
            caveats: [
              {
                id: "caveat-1",
                label: "Readiness gate",
                detail: "Validate source-system readiness before funding.",
              },
            ],
            nextSteps: [
              {
                id: "next-1",
                label: "Move demand sensing into P0 Originate.",
                rationale: "It has the clearest value signal.",
              },
            ],
            citations: [
              {
                id: "c1",
                label: "Supply chain benchmark pack",
                sourceClass: "corpus-pattern",
                excerpt: "Demand sensing has strong evidence in volatile networks.",
              },
            ],
          },
        },
      ],
    });

    expect(html).toContain("aVa Executive Session Export");
    expect(html).toContain("Supply chain AI investment session");
    expect(html).toContain("User prompt 1");
    expect(html).toContain("Give me the top 5 supply chain AI bets.");
    expect(html).toContain("aVa response 2");
    expect(html).toContain("Supply Chain AI Matrix");
    expect(html).toContain("Ranked Use Cases");
    expect(html).toContain("Visual artifacts");
    expect(html).toContain("Evidence Used");
    expect(html).toContain("Supply chain benchmark pack");
    expect(html).toContain("Validate source-system readiness before funding.");
    expect(html).toContain("Move demand sensing into P0 Originate.");
  });
});
