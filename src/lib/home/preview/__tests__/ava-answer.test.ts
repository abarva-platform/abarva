import { getAuditedAnthropicClient } from "@/lib/agent/stream";

import { answerHomeAvaQuestion } from "../ava-answer";
import type { ChapterView, TechnologyEstateBundle } from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const mockGetAuditedAnthropicClient = getAuditedAnthropicClient as jest.MockedFunction<typeof getAuditedAnthropicClient>;

function mockClaudeJson(payload: unknown) {
  mockGetAuditedAnthropicClient.mockResolvedValue({
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(payload) }] }),
      },
    },
    auditId: "audit-test",
    dataClass: "confidential",
  } as never);
}

const CHAPTERS: ChapterView[] = [
  {
    chapterId: "technology_data",
    title: "Technology & Data",
    guidingQuestion: "What runs the enterprise?",
    headline: "A concentrated, aging estate.",
    executive_synthesis: "Epic Hyperspace is the backbone of clinical operations.",
    key_insights: [
      { statement: "Epic Hyperspace Production integrates with 80 other systems.", evidence_ids: ["ctx_1"], confidence: "high", claim_type: "FACT" },
    ],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: [],
  },
];

const TECHNOLOGY_ESTATE: TechnologyEstateBundle = {
  recordTypes: [
    {
      objectType: "application_system",
      label: "Applications & Systems",
      columns: ["systemName", "businessFunction"],
      rows: [{ systemName: "Epic Hyperspace — Production", businessFunction: "Acute Care Clinical Operations" }],
      primaryDimension: "businessFunction",
      dimensionCounts: [
        { value: "Acute Care Clinical Operations", count: 56 },
        { value: "Clinical Informatics", count: 99 },
      ],
    },
  ],
};

describe("answerHomeAvaQuestion", () => {
  beforeEach(() => {
    mockGetAuditedAnthropicClient.mockReset();
  });

  it("packages a grounded answer, resolving a cited tag to its real claim text", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "Epic Hyperspace Production is the most connected system, with 80 integrations.",
      prose: "",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "What system has the most integrations?",
    });

    expect(answer.status).toBe("answered");
    expect(answer.citations).toHaveLength(1);
    expect(answer.citations[0].id).toBe("TD-K1");
    expect(answer.citations[0].excerpt).toBe("Epic Hyperspace Production integrates with 80 other systems.");
    expect(answer.artifacts).toHaveLength(0);
  });

  it("drops a cited tag the model invented instead of trusting it", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "Some answer.",
      cited_claim_tags: ["TD-K1", "TD-K99"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "irrelevant",
    });

    expect(answer.citations).toHaveLength(1);
    expect(answer.citations[0].id).toBe("TD-K1");
  });

  it("builds a chart artifact strictly from the real precomputed dataset, never model-supplied numbers", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "Clinical Informatics has the most applications.",
      cited_claim_tags: [],
      visual: {
        type: "chart",
        dataset_ref: "tech.application_system.by_businessFunction",
        chart_kind: "bar",
      },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "Which business function has the most applications?",
    });

    expect(answer.artifacts).toHaveLength(1);
    const chart = answer.artifacts[0];
    expect(chart.artifact).toBe("chart");
    if (chart.artifact === "chart") {
      // Real dimensionCounts values, not anything the model wrote into the JSON above.
      expect(chart.data).toEqual([
        { label: "Acute Care Clinical Operations", value: 56 },
        { label: "Clinical Informatics", value: 99 },
      ]);
    }
  });

  it("silently drops a visual request for a dataset_ref that doesn't exist rather than fabricating one", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "Some answer.",
      cited_claim_tags: [],
      visual: { type: "chart", dataset_ref: "tech.vendor_contract.by_vendorTier", chart_kind: "bar" },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "irrelevant",
    });

    expect(answer.artifacts).toHaveLength(0);
  });

  it("honors an honest no_data status rather than forcing an answer", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer: "That isn't covered in what I have available for this tenant yet.",
      cited_claim_tags: [],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "What is the company's stock price?",
    });

    expect(answer.status).toBe("no_data");
    expect(answer.quality.answerCompleteness).toBe("blocked");
  });

  it("falls back gracefully when the model returns unparseable JSON", async () => {
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: {
        messages: {
          create: jest.fn().mockResolvedValue({ content: [{ type: "text", text: "not json at all" }] }),
        },
      },
      auditId: "audit-test",
      dataClass: "confidential",
    } as never);

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "irrelevant",
    });

    expect(answer.status).toBe("no_data");
    expect(answer.artifacts).toHaveLength(0);
  });

  it("falls back gracefully when the audited client call throws", async () => {
    mockGetAuditedAnthropicClient.mockRejectedValue(new Error("no ANTHROPIC_API_KEY"));

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "irrelevant",
    });

    expect(answer.status).toBe("no_data");
    expect(answer.caveats.some((c) => c.detail.includes("no ANTHROPIC_API_KEY"))).toBe(true);
  });
});
