jest.mock("server-only", () => ({}));

import { renderToBuffer } from "@react-pdf/renderer";

import {
  buildAvaAnswerPdf,
  buildAvaChatSessionPdf,
} from "@/lib/ava-answer/export/render-answer-pdf";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

function answerFixture(): AvaAnswerPacket {
  return {
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: "meridian-health",
    question:
      "For Meridian agent assist, rank the top opportunities by value and complexity.",
    intent: "portfolio_comparison",
    status: "answered",
    directAnswer:
      "Agent assist should focus first on call-resolution and claims-status workflows.",
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [
      {
        artifact: "chart",
        id: "agent-assist-value",
        kind: "horizontal-bar",
        title: "Agent Assist Value Drivers",
        subtitle: "Prioritized from loaded Meridian service context",
        builder: "inlineChart",
        data: {
          type: "horizontal-bar",
          xKey: "driver",
          yKey: "score",
          unit: "%",
          data: [
            { driver: "First-call resolution", score: 84 },
            { driver: "Transfer reduction", score: 62 },
          ],
        },
      },
      {
        artifact: "graph",
        id: "agent-assist-dependencies",
        title: "Agent Assist Dependency Graph",
        nodes: [
          { id: "crm", label: "CRM history" },
          { id: "claims", label: "Claims platform" },
          { id: "workspace", label: "Agent assist workspace" },
        ],
        edges: [
          { from: "crm", to: "workspace", label: "feeds member context" },
          { from: "claims", to: "workspace", label: "answers claim status" },
        ],
      },
      {
        artifact: "table",
        id: "agent-assist-roadmap",
        title: "Ranked Agent Assist Opportunities",
        columns: [
          { key: "opportunity", label: "Opportunity" },
          {
            key: "annual_value_usd",
            label: "Annual value",
            format: "currency",
          },
          { key: "complexity_pct", label: "Complexity", format: "percent" },
        ],
        rows: [
          {
            opportunity: "Claims-status agent assist",
            annual_value_usd: 8200000,
            complexity_pct: 0.42,
          },
        ],
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

function pdfText(buffer: Buffer): string {
  return buffer.toString("latin1");
}

describe("buildAvaAnswerPdf", () => {
  it("preserves complete admitted narrative, record basis and evidence in a session export", async () => {
    const answer: AvaAnswerPacket = {
      ...answerFixture(),
      surface: "home",
      directAnswer: "The value claim needs verification.",
      prose:
        "**Bottom line**\n\nThe value claim needs verification.\n\n**Key points**\n\n- **Value proof:** Validate the declared benefit baseline.\n\n- **Leadership:** These are modelled responses, not actual testimony.\n\n**Next step:** Agree the baseline before approving further investment.\n\n*Record basis: Reviewed stored record. Synthetic reference, not client-attested. Data currency is not independently attested.*",
      artifacts: [],
      citations: [
        {
          id: "reference-basis",
          label: "Record declaration",
          sourceClass: "tenant-fact",
          excerpt: "A modelled reference, not client-attested.",
        },
      ],
    };
    const output = await renderToBuffer(
      buildAvaChatSessionPdf({
        surface: "home-preview",
        turns: [{ id: "answer", role: "agent", body: answer.prose!, answer }],
      }),
    );
    const text = pdfText(output);
    for (const expected of [
      "Value proof:",
      "Validate the declared benefit baseline.",
      "modelled responses",
      "Next step:",
      "Reviewed stored record",
      "Synthetic reference, not client-attested",
      "Evidence Used",
      "Record declaration",
      "A modelled reference, not client-attested.",
    ])
      expect(text).toContain(expected);
    expect(text.match(/The value claim needs verification\./g)).toHaveLength(1);
  });

  it("keeps a distinct headline alongside supplementary prose", async () => {
    const answer = {
      ...answerFixture(),
      directAnswer: "Headline judgment.",
      prose: "Supporting detail must not disappear.",
      artifacts: [],
    };
    const text = pdfText(await renderToBuffer(buildAvaAnswerPdf(answer)));
    expect(text).toContain("Headline judgment.");
    expect(text).toContain("Supporting detail must not disappear.");
  });

  it("preserves structured tables, chart exhibits, and graph relationships", async () => {
    const buffer = await renderToBuffer(buildAvaAnswerPdf(answerFixture()));
    const text = pdfText(buffer);

    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("Agent Assist Value Drivers");
    expect(text).toContain("First-call resolution");
    expect(text).toContain("84%");
    expect(text).toContain("Agent Assist Dependency Graph");
    expect(text).toContain("CRM history -> Agent assist workspace");
    expect(text).toContain("answers claim status");
    expect(text).toContain("Ranked Agent Assist Opportunities");
    expect(text).toContain("Claims-status agent assist");
    expect(text).toContain("$8.2M");
    expect(text).toContain("42%");
    expect(text).not.toContain("8200000");
  });
});
