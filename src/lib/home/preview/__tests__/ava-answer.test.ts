import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

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
  {
    chapterId: "performance_value",
    title: "Performance & Value",
    guidingQuestion: "Can we prove the value?",
    headline: "Value proof is incomplete.",
    executive_synthesis: "Finance has attested only part of the claimed value.",
    key_insights: [
      { statement: "Only 23 of 50 tracked metrics are claimable or ready.", evidence_ids: ["ctx_2"], confidence: "high", claim_type: "FACT" },
    ],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: ["Finance attestation does not cover every value claim."],
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

function maxParagraphWords(text: string | undefined): number {
  return Math.max(
    0,
    ...(text ?? "")
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim().split(/\s+/).filter(Boolean).length),
  );
}

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

  it("keeps cross-chapter claims citable when the user is focused on one chapter", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "The technology concern is partly a value-proof concern.",
      prose: "",
      cited_claim_tags: ["TD-K1", "PV-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "What concerns you about our technology estate?",
      activeChapterId: "technology_data",
    });

    expect(answer.citations.map((citation) => citation.id)).toEqual(["TD-K1", "PV-K1"]);
    expect(answer.citations[1].excerpt).toBe("Only 23 of 50 tracked metrics are claimable or ready.");
  });

  it("sends an enterprise context spine and active focus hint instead of a chapter-only payload", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "The estate should be read with value proof in mind.",
      prose: "",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "What concerns you about our data strategy?",
      activeChapterId: "technology_data",
    });

    const prompt = mockGetAuditedAnthropicClient.mock.calls[0][0].prompt;
    expect(prompt).toContain('"enterprise_context_spine"');
    expect(prompt).toContain('"question_context_plan"');
    expect(prompt).toContain('"active_chapter_focus": "technology_data"');
    expect(prompt).toContain('"focus_is_not_a_context_limit": true');
    expect(prompt).toContain('"chapterId": "performance_value"');
    expect(prompt).toContain('"data_analytics_ai"');
    expect(prompt).toContain('"strategy_priorities"');
    expect(prompt).toContain("enterprise_context_spine and record_summaries are orientation and routing context");
    expect(prompt).toContain("Tagged chapter claims are factual answer material");
    expect(prompt).toContain("Deterministic plottable_datasets are quantitative exhibit material");
    expect(prompt).toContain("Use compact consulting structure");
    expect(prompt).not.toContain("scoped_to_active_chapter");
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

  it("compacts overlong model paragraphs before packaging the preview answer", async () => {
    const longSentence = Array.from({ length: 145 }, (_value, index) => `word${index + 1}`).join(" ");
    mockClaudeJson({
      status: "answered",
      direct_answer: longSentence,
      prose: `${longSentence}. Second paragraph stays compact.`,
      cited_claim_tags: ["TD-K1", "PV-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed, and what evidence supports that?",
    });

    expect(answer.status).toBe("answered");
    expect(maxParagraphWords(answer.directAnswer)).toBeLessThanOrEqual(55);
    expect(maxParagraphWords(answer.prose)).toBeLessThanOrEqual(70);
    expect(answer.prose).toContain("\n\n");
    expect(answer.citations.map((citation) => citation.id)).toEqual(["TD-K1", "PV-K1"]);
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

  it("recovers broad CXO questions from cited chapter claims instead of returning generic no_data", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer: "I couldn't produce a grounded answer to that just now -- try rephrasing the question.",
      prose: "",
      cited_claim_tags: [],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question:
        "I'm on Technology & Data, but tell me what the CFO should care about. Keep it to 5 crisp bullets, with confidence and evidence limits.",
      activeChapterId: "technology_data",
    });

    expect(answer.status).toBe("partial");
    expect(answer.directAnswer).toMatch(/directionally/i);
    expect(answer.prose).toContain("- ");
    expect(answer.prose).toContain("Confidence:");
    expect(answer.prose).toContain("Support:");
    expect(answer.prose).toContain("Caveat:");
    expect(answer.gaps).toHaveLength(1);
    expect(answer.prose).not.toContain("try rephrasing");
    expect(answer.citations.map((citation) => citation.id)).toEqual(
      expect.arrayContaining(["TD-K1", "PV-K1"]),
    );
    expect(answer.quality.confidence).not.toBe("low");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("recovers board-reader caveat questions from attention claims", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer:
        "I couldn't produce a grounded answer to that just now -- try rephrasing the question.",
      prose: "",
      cited_claim_tags: [],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [
          ...CHAPTERS,
          {
            chapterId: "what_needs_attention",
            title: "What Needs Attention",
            guidingQuestion: "What needs attention?",
            headline: "Evidence limits need an explicit readout.",
            executive_synthesis:
              "Open risks and incomplete evidence should be named before recommendations.",
            key_insights: [
              {
                statement:
                  "High-severity risks should be handled as open evidence questions until control status is assessed.",
                evidence_ids: ["ctx_3"],
                confidence: "high",
                claim_type: "FACT",
              },
            ],
            tensions: [
              {
                statement:
                  "A board reader could mistake missing control assessment for confirmed uncontrolled risk.",
                evidence_ids: ["ctx_4"],
                confidence: "medium",
                claim_type: "ADVISORY_INFERENCE",
              },
            ],
            what_to_watch: [],
            questions_to_ask: [],
            visual_opportunities: [],
            limitations: ["Control status needs owner confirmation."],
          },
        ],
        technologyEstate: TECHNOLOGY_ESTATE,
      },
      tenantKey: "meridian-health",
      question: "What could mislead a board reader on this page?",
      activeChapterId: "technology_data",
    });

    expect(answer.status).toBe("partial");
    expect(answer.prose).toContain("Confidence:");
    expect(answer.prose).toContain("Support:");
    expect(answer.gaps).toHaveLength(1);
    expect(answer.prose).not.toContain("try rephrasing");
    expect(answer.citations.map((citation) => citation.id)).toEqual(
      expect.arrayContaining(["WA-T1"]),
    );
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
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

  it("recovers board-reader questions when the model response is unparseable", async () => {
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
      question: "What could mislead a board reader on this page?",
      activeChapterId: "technology_data",
    });

    expect(answer.status).toBe("partial");
    expect(answer.prose).toContain("Confidence:");
    expect(answer.prose).toContain("Support:");
    expect(answer.prose).not.toContain("try rephrasing");
    expect(answer.citations.length).toBeGreaterThan(0);
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
