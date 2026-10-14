import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

import {
  answerHomeAvaQuestion,
  homeAvaAnswerFollowUpQuestions,
} from "../ava-answer";
import type { ChapterView, TechnologyEstateBundle } from "../types";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

jest.mock("../source-support", () => ({
  verifyHomeAnswerSupport: jest.fn().mockResolvedValue({
    supported: true, reason: "supported", unsupportedFields: [],
  }),
}));

const mockGetAuditedAnthropicClient =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;

it("rehydrates prior claim references from this record without accepting unknown references", async () => {
  mockClaudeJson({
    status: "answered",
    direct_answer: "Value proof is incomplete.",
    prose: "Only 23 of 50 tracked metrics are claimable or ready.",
    cited_claim_tags: ["PV-K1"],
    visual: { type: "none", dataset_ref: null },
    caveats: [],
  });
  await answerHomeAvaQuestion({
    bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
    tenantKey: CANONICAL_TENANT_KEYS[0],
    question: "Why does that matter to the CFO?",
    conversation: [
      {
        question: "Tell me about the technology estate",
        citedClaimTags: ["TD-K1", "FAKE-OLD-CLAIM"],
      },
    ],
  });
  const prompt = mockGetAuditedAnthropicClient.mock.calls[0][0].prompt;
  const intent = JSON.parse(
    prompt.match(/Conversation intent \(JSON\):\n([\s\S]*?)\n\nContext/)![1],
  );
  expect(intent[0].question).toBe("Tell me about the technology estate");
  expect(intent[0].cited_claims).toEqual([
    { tag: "TD-K1", statement: CHAPTERS[0].key_insights[0].statement },
  ]);
  expect(prompt).not.toContain("FAKE-OLD-CLAIM");
});

function mockClaudeJson(payload: unknown) {
  mockGetAuditedAnthropicClient.mockResolvedValue({
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text: JSON.stringify(payload) }],
        }),
      },
    },
    auditId: "audit-test",
    dataClass: "confidential",
  } as never);
}

it("does not append an inventory table to a qualitative executive readout", async () => {
  mockClaudeJson({
    status: "answered",
    direct_answer: "Value proof is incomplete.",
    prose: "Only 23 of 50 tracked metrics are claimable or ready.",
    cited_claim_tags: ["PV-K1"],
    visual: {
      type: "table",
      dataset_ref: "tech.application_system.by_businessFunction",
    },
    caveats: [],
  });
  const answer = await answerHomeAvaQuestion({
    bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
    tenantKey: CANONICAL_TENANT_KEYS[0],
    question: "Talk to me about the current state of data analytics",
  });
  expect(answer.artifacts).toEqual([]);
  expect(answer.citations).not.toHaveLength(0);
});

const CHAPTERS: ChapterView[] = [
  {
    chapterId: "technology_data",
    title: "Technology & Data",
    guidingQuestion: "What runs the enterprise?",
    headline: "A concentrated, aging estate.",
    executive_synthesis:
      "Epic Hyperspace is the backbone of clinical operations.",
    key_insights: [
      {
        statement:
          "Epic Hyperspace Production integrates with 80 other systems.",
        evidence_ids: ["ctx_1"],
        confidence: "high",
        claim_type: "FACT",
      },
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
      {
        statement: "Only 23 of 50 tracked metrics are claimable or ready.",
        evidence_ids: ["ctx_2"],
        confidence: "high",
        claim_type: "FACT",
      },
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
      rows: [
        {
          systemName: "Epic Hyperspace — Production",
          businessFunction: "Acute Care Clinical Operations",
        },
      ],
      primaryDimension: "businessFunction",
      dimensionCounts: [
        { value: "Acute Care Clinical Operations", count: 56 },
        { value: "Clinical Informatics", count: 99 },
      ],
    },
    {
      objectType: "vendor_contract",
      label: "Vendor Contracts",
      columns: ["vendorName"],
      rows: Array.from({ length: 230 }, (_value, index) => ({
        vendorName: `Vendor ${index + 1}`,
      })),
      primaryDimension: "serviceCategory",
      dimensionCounts: [],
    },
    {
      objectType: "data_asset_or_integration",
      label: "Data Assets & Integrations",
      columns: ["dataAssetName"],
      rows: Array.from({ length: 1710 }, (_value, index) => ({
        dataAssetName: `Data asset ${index + 1}`,
      })),
      primaryDimension: "dataDomain",
      dimensionCounts: [],
    },
  ],
};

const TECHNOLOGY_ESTATE_WITH_VENDOR_SPEND: TechnologyEstateBundle = {
  recordTypes: [
    {
      objectType: "vendor_contract",
      label: "Vendor Contracts",
      columns: ["vendorName", "annualSpendUsd", "pricingHistory"],
      rows: [
        {
          vendorName: "Current Supplier Alpha",
          annualSpendUsd: 100,
          pricingHistory: "Current year pricing available.",
        },
        {
          vendorName: "Current Supplier Beta",
          annualSpendUsd: 90,
          pricingHistory: "Current year pricing available.",
        },
        {
          vendorName: "Outdated Supplier",
          annualSpendUsd: 5,
          pricingHistory: "Current year pricing available.",
        },
        {
          vendorName: "Legacy Supplier",
          annualSpendUsd: 4,
          pricingHistory: "Current year pricing available.",
        },
      ],
      primaryDimension: "vendorName",
      dimensionCounts: [],
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

  const leadershipChapter: ChapterView = {
    ...CHAPTERS[0],
    chapterId: "leadership_perspective",
    title: "Leadership Perspective",
    key_insights: [
      {
        statement:
          "Modelled reference responses: 36 of 44 leaders raised data trust concerns.",
        evidence_ids: ["modelled-reference-1"],
        confidence: "high",
        claim_type: "FACT",
      },
    ],
  };
  const referenceAnswer = {
    status: "answered",
    direct_answer: "Data trust needs verification.",
    key_points: [
      "**Leadership:** Modelled responses: 36 of 44 leaders raised data trust concerns.",
    ],
    cited_claim_tags: ["LP-K1"],
    visual: { type: "none" },
    caveats: [],
  };

  describe("quantitative narrative grounding", () => {
    const safe = {
      status: "partial",
      direct_answer:
        "The named system is relevant context, not a feasibility baseline.",
      key_points: [
        "**Context:** The cited application claim does not establish inquiry volumes or successful self-service resolution.",
      ],
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none" },
      caveats: [],
    };

    it.each([
      { direct_answer: "The member data domain has 33 assets." },
      { key_points: ["**Context:** The member data domain has 33 assets."] },
      { prose: "The member data domain has 33 assets." },
      { caveats: ["The member data domain has 33 assets."] },
      {
        key_points: ["**Context:** Clinical Informatics has 99 applications."],
      },
      { key_points: ["**Context:** The system reaches 80% of applications."] },
      {
        key_points: ["**Context:** The proposal has achieved 20% resolution."],
      },
      {
        key_points: [
          "**Baseline:** Current resolution is 20% against a proposed target of 20%.",
        ],
      },
      {
        key_points: [
          "**Baseline:** Current resolution is 20% against the unmeasured proposed 20% target.",
        ],
      },
      { key_points: ["**Target:** The 20% target is not proposed."] },
      {
        key_points: [
          "**Target:** The proposed 20% target is the recorded current resolution baseline.",
        ],
      },
      {
        key_points: [
          "**Target:** Evidence confirms this is not a proposed 20% resolution target.",
        ],
      },
      {
        key_points: ["**Target:** Evidence informs the proposed 20%% target."],
      },
      {
        key_points: [
          "**Target:** Evidence informs the proposed 20%USD target.",
        ],
      },
      {
        key_points: [
          "**Baseline:** Current resolution is 20% against a 20% target that remains proposed.",
        ],
      },
      {
        key_points: [
          "**Target:** The 20% target remains proposed, but 20% resolution was achieved.",
        ],
      },
      {
        key_points: [
          "**Target:** A proposed 20% target is not a measured result or a savings commitment, but delivered 20% savings.",
        ],
      },
    ])(
      "corrects uncited quantitative material rather than licensing it from summaries: %j",
      async (unsafe) => {
        const create = jest
          .fn()
          .mockResolvedValueOnce({
            content: [
              { type: "text", text: JSON.stringify({ ...safe, ...unsafe }) },
            ],
          })
          .mockResolvedValueOnce({
            content: [{ type: "text", text: JSON.stringify(safe) }],
          });
        mockGetAuditedAnthropicClient.mockResolvedValue({
          client: { messages: { create } },
        } as never);
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question:
            "Assess a proposed 20% successful resolution target for discovery.",
        });
        expect(create).toHaveBeenCalledTimes(2);
        expect(
          mockGetAuditedAnthropicClient.mock.calls[1][0].metadata,
        ).toMatchObject({
          presentationRepairReasons: expect.arrayContaining([
            expect.stringContaining("Quantities in narrative"),
          ]),
        });
        expect(answer.prose).toContain("does not establish inquiry volumes");
        expect(JSON.stringify(answer.caveats)).not.toContain("33 assets");
        expect(answer.artifacts).toEqual([]);
        expect(validateAvaAnswerPacket(answer).passed).toBe(true);
      },
    );

    it("withholds persistent unsupported quantities and removes unsafe caveats", async () => {
      mockClaudeJson({
        ...safe,
        key_points: ["**Context:** The member domain has 33 assets."],
        caveats: ["There are 33 assets."],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Assess business fit.",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
      expect(answer.status).toBe("partial");
      expect(answer.prose).toBeUndefined();
      expect(answer.caveats).toEqual([]);
      expect(answer.citations.map((citation) => citation.id)).toContain(
        "TD-K1",
      );
    });

    it.each([
      "**Target:** 20% is a proposed target, not a measured result.",
      "**Target:** The proposed 20 percent target remains an unmeasured assumption.",
      "**Target:** The 20% successful self-service resolution target is proposed, not measured or committed savings.",
      "**Target:** The proposed 20% resolution target is not a measured result or a savings commitment.",
      "**Target:** A 20% target remains a proposed assumption, not an achieved result.",
      "**Target:** The proposed 20% target is not a measured baseline or a savings commitment.",
    ])(
      "retains a user-supplied proposal with its local qualification: %s",
      async (point) => {
        mockClaudeJson({ ...safe, key_points: [point] });
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: CHAPTERS },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question: "Assess a proposed 20% target.",
        });
        expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
        expect(answer.prose).toContain(point);
      },
    );

    it("does not treat an arbitrary user-supplied figure as measured evidence", async () => {
      mockClaudeJson({
        ...safe,
        key_points: ["**Result:** Successful resolution is 20%."],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Is successful resolution 20%?",
      });
      expect(answer.prose).toBeUndefined();
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    });

    it("preserves a signed proposed percentage through packet admission", async () => {
      mockClaudeJson({
        ...safe,
        key_points: [
          "**Target:** Evidence informs the proposed -20% change target, not a measured result.",
        ],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Assess a proposed -20% change target.",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer.prose).toContain("proposed -20% change target");
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    });

    it("retains three concise discovery points with a locally qualified proposed target", async () => {
      mockClaudeJson({
        ...safe,
        key_points: [
          "**Fit:** The named system is relevant context, not a feasibility baseline.",
          "**Target:** The 20% successful self-service resolution target remains proposed, not measured or committed savings.",
          "**Discovery:** Establish baseline evidence before chartering discovery; assess Agent Assist separately and do not assume outsourcing.",
        ],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question:
          "Give three short cited bullets for discovery. Treat 20% successful self-service resolution as a proposed target, not measured or committed savings.",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer).toMatchObject({ prose: expect.any(String) });
      expect(answer.prose?.match(/^- /gm)).toHaveLength(3);
      expect(answer.prose).toContain(
        "remains proposed, not measured or committed savings",
      );
      expect(answer.citations.map((citation) => citation.id)).toContain(
        "TD-K1",
      );
    });

    it.each([
      [
        "Recorded value is $1.5M, with 24% validated.",
        "**Value:** Recorded value is USD 1,500,000, with 24 percent validated.",
      ],
      [
        "Recorded value is $1.5M.",
        "**Value:** Recorded value is 1.5 million USD.",
      ],
      [
        "The target is 3.5 by 2028.",
        "**Target:** The cited target is 3.5 by 2028 [PV-K1].",
      ],
      [
        "The system reaches 80 other systems.",
        "**Context:** The cited system reaches 80 other systems; P0/P1 discovery still needs a baseline.",
      ],
    ])(
      "accepts cited quantities across equivalent display formats: %s",
      async (statement, point) => {
        const chapter = {
          ...CHAPTERS[1],
          key_insights: [{ ...CHAPTERS[1].key_insights[0], statement }],
        };
        mockClaudeJson({
          ...safe,
          key_points: [point],
          cited_claim_tags: ["PV-K1"],
        });
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: [chapter] },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question: "Summarize the cited record.",
        });
        expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
        expect(answer.prose).not.toBeUndefined();
      },
    );

    it("does not admit a number from a claim that was offered but not cited", async () => {
      mockClaudeJson({
        ...safe,
        key_points: ["**Value:** Only 23 of 50 tracked metrics are ready."],
        cited_claim_tags: ["TD-K1", "FAKE-K1"],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Summarize value proof.",
      });
      expect(answer.prose).toBeUndefined();
      expect(answer.citations.map((citation) => citation.id)).not.toContain(
        "PV-K1",
      );
    });

    it.each([
      "**Rate:** Change is -20%.",
      "**Volume:** The named system integrates with -80 systems.",
    ])(
      "does not drop a sign when matching cited quantities: %s",
      async (point) => {
        const source = {
          ...CHAPTERS[1],
          key_insights: [
            {
              ...CHAPTERS[1].key_insights[0],
              statement:
                "Change is 20%; the named system integrates with 80 systems.",
            },
          ],
        };
        mockClaudeJson({
          ...safe,
          key_points: [point],
          cited_claim_tags: ["PV-K1"],
        });
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: [source] },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question: "Summarize the cited context.",
        });
        expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
        expect(answer.prose).toBeUndefined();
      },
    );

    it("does not let count formatting upgrade a cited pilot population to the full inventory", async () => {
      const source = {
        ...CHAPTERS[1],
        key_insights: [
          {
            ...CHAPTERS[1].key_insights[0],
            statement: "The pilot covers 50 tracked data assets/integrations.",
          },
        ],
      };
      mockClaudeJson({
        ...safe,
        key_points: [
          "**Pilot:** The pilot covers 50 tracked data assets/integrations.",
        ],
        caveats: ["The pilot covers 50 tracked data assets/integrations."],
        cited_claim_tags: ["PV-K1"],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: [source], technologyEstate: TECHNOLOGY_ESTATE },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Summarize the pilot context.",
      });
      expect(
        JSON.stringify({ prose: answer.prose, caveats: answer.caveats }),
      ).not.toContain("1710");
      expect(answer.prose).toBeUndefined();
      expect(answer.caveats).toEqual([]);
    });

    it("filters uncited numerical limitations from recovery copy and its gap", async () => {
      const source = {
        ...CHAPTERS[0],
        limitations: ["33 applications need owner confirmation."],
      };
      mockClaudeJson({ status: "no_data", cited_claim_tags: [], caveats: [] });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: [source] },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What technology context should the CFO know?",
      });
      expect(answer.status).toBe("partial");
      expect(
        JSON.stringify({
          prose: answer.prose,
          caveats: answer.caveats,
          gaps: answer.gaps,
        }),
      ).not.toContain("33 applications");
      expect(answer.citations.map((citation) => citation.id)).toContain(
        "TD-K1",
      );
    });

    it("does not restore unqualified reference testimony from the original caveats after repair", async () => {
      const create = jest
        .fn()
        .mockResolvedValueOnce({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ...referenceAnswer,
                caveats: ["36 of 44 leaders reported data trust concerns."],
              }),
            },
          ],
        })
        .mockResolvedValueOnce({
          content: [{ type: "text", text: JSON.stringify(referenceAnswer) }],
        });
      mockGetAuditedAnthropicClient.mockResolvedValue({
        client: { messages: { create } },
      } as never);
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What data trust issue matters?",
      });
      expect(create).toHaveBeenCalledTimes(2);
      expect(answer.prose).toContain("Modelled responses");
      expect(JSON.stringify(answer.caveats)).not.toContain("leaders reported");
    });
  });

  it("keeps an explicit business overview business-primary despite technology focus and earlier questions", async () => {
    const business = {
      ...CHAPTERS[1],
      chapterId: "our_business" as const,
      title: "Our Business",
      key_insights: [
        {
          ...CHAPTERS[1].key_insights[0],
          statement:
            "The enterprise operates across two declared business segments.",
        },
      ],
    };
    mockClaudeJson({
      status: "partial",
      direct_answer:
        "The record describes the business model, not segment profitability.",
      key_points: [
        "**Business:** The enterprise operates across two declared business segments.",
      ],
      cited_claim_tags: ["OB-K1"],
      visual: { type: "none" },
      caveats: [],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [...CHAPTERS, business],
        technologyEstate: TECHNOLOGY_ESTATE,
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      activeChapterId: "technology_data",
      question: "What do we know about the business, not just technology?",
      conversation: [
        {
          question: "Tell me about data platforms and technology.",
          citedClaimTags: ["TD-K1"],
        },
      ],
    });
    const prompt = mockGetAuditedAnthropicClient.mock.calls[0][0].prompt;
    const context = JSON.parse(
      prompt.match(/Context \(JSON\):\n([\s\S]*)$/)![1],
    );
    expect(context.question_context_plan.primary_domains).toEqual([
      "business_model",
      "applications_technology",
    ]);
    const followUps = homeAvaAnswerFollowUpQuestions(answer);
    expect(followUps).toHaveLength(3);
    expect(followUps.join(" ")).toContain("business model");
    expect(followUps.join(" ")).not.toContain("applications and technology");
    expect(mockGetAuditedAnthropicClient.mock.calls[0][0].prompt).toContain(
      "A share attributed jointly to two populations cannot be attributed to one component",
    );
  });

  describe("combined revenue population admission", () => {
    const source = {
      ...CHAPTERS[1],
      chapterId: "our_business" as const,
      key_insights: [
        {
          ...CHAPTERS[1].key_insights[0],
          statement:
            "Revenue is split 60% provider delivery / 40% health plan, with the health plan itself 70% Medicare Advantage and Medicare FFS versus 30% commercial and Medicaid managed care.",
        },
      ],
    };
    const safe = {
      status: "partial",
      direct_answer:
        "The enterprise combines provider delivery and a health plan.",
      key_points: [
        "**Composition:** Provider delivery represents 60% of revenue and health plan operations 40%.",
        "**Plan mix:** Medicare Advantage and Medicare FFS jointly represent 70% of health plan revenue.",
        "**Discovery:** Establish the current service baseline before assessing a proposed transformation.",
      ],
      cited_claim_tags: ["OB-K1"],
      caveats: [],
    };

    it("does not use a postposed negated share as concentration support", async () => {
      mockClaudeJson({
        ...safe,
        direct_answer: "Revenue is concentrated in Medicare Advantage.",
        cited_claim_tags: ["OB-K1", "OB-K2"],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [
            {
              ...source,
              key_insights: [
                ...source.key_insights,
                {
                  ...source.key_insights[0],
                  statement:
                    "That Medicare Advantage accounts for 60% of revenue is not established.",
                },
              ],
            },
          ],
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What do we know about the business?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
      expect(answer.prose).toBeUndefined();
      expect(answer.directAnswer).not.toContain("Revenue is concentrated");
    });

    it.each([false, true])(
      "repairs or withholds an unsupported MA-only opener (%s)",
      async (validRepair) => {
        const unsafe = {
          ...safe,
          direct_answer: "Revenue is concentrated in Medicare Advantage.",
        };
        const create = jest
          .fn()
          .mockResolvedValueOnce({
            content: [{ type: "text", text: JSON.stringify(unsafe) }],
          })
          .mockResolvedValueOnce({
            content: [
              {
                type: "text",
                text: JSON.stringify(validRepair ? safe : unsafe),
              },
            ],
          });
        mockGetAuditedAnthropicClient.mockResolvedValue({
          client: { messages: { create } },
        } as never);
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: [source] },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question:
            "What do we know about the business? Give three short points.",
        });
        expect(create).toHaveBeenCalledTimes(2);
        expect(answer.directAnswer).not.toContain("Revenue is concentrated");
        expect(answer.prose !== undefined).toBe(validRepair);
        expect(validateAvaAnswerPacket(answer).passed).toBe(true);
      },
    );
  });

  describe("conditional source effect admission", () => {
    const source = {
      ...CHAPTERS[1],
      chapterId: "our_business" as const,
      key_insights: [
        {
          ...CHAPTERS[1].key_insights[0],
          statement:
            "Alpha and Beta jointly represent 70% of Division revenue, a mix that could make Alpha performance an outsized factor in Division economics.",
        },
      ],
    };
    const safe = {
      status: "partial",
      direct_answer:
        "The record establishes joint revenue composition, not enterprise causality.",
      key_points: [
        "**Economics:** Alpha performance could be an outsized factor in Division economics.",
      ],
      cited_claim_tags: ["OB-K1"],
      visual: { type: "none" },
      caveats: [],
    };
    it.each([
      {
        direct_answer:
          "The business has two segments where Expanded Alpha performance carries outsized weight in overall economics.",
      },
      {
        key_points: [
          "**Economics:** Alpha performance carries outsized weight in overall economics.",
        ],
      },
      {
        prose:
          "Alpha performance carries outsized weight in overall economics.",
      },
      {
        caveats: [
          "Alpha performance carries outsized weight in overall economics.",
        ],
      },
    ])(
      "corrects certainty upgrades in each narrative field: %j",
      async (unsafe) => {
        const create = jest
          .fn()
          .mockResolvedValueOnce({
            content: [
              { type: "text", text: JSON.stringify({ ...safe, ...unsafe }) },
            ],
          })
          .mockResolvedValueOnce({
            content: [{ type: "text", text: JSON.stringify(safe) }],
          });
        mockGetAuditedAnthropicClient.mockResolvedValue({
          client: { messages: { create } },
        } as never);
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: [source] },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question: "What do we know about the business?",
        });
        expect(create).toHaveBeenCalledTimes(2);
        expect(
          mockGetAuditedAnthropicClient.mock.calls[1][0].metadata,
        ).toMatchObject({
          presentationRepairReasons: expect.arrayContaining([
            expect.stringContaining("conditional effect language"),
          ]),
        });
        expect(answer.prose).toContain("could be an outsized factor");
        expect(JSON.stringify(answer.caveats)).not.toContain(
          "carries outsized weight",
        );
      },
    );

    it("withholds an unsafe opener even when its supporting bullet stays conditional", async () => {
      mockClaudeJson({
        ...safe,
        direct_answer:
          "Alpha performance carries outsized weight in overall economics.",
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: [source] },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What do we know about the business?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
      expect(answer.status).toBe("partial");
      expect(answer.prose).toBeUndefined();
      expect(answer.directAnswer).not.toContain("carries outsized weight");
      expect(answer.citations.map((citation) => citation.id)).toContain(
        "OB-K1",
      );
    });

    it("admits separately cited categorical support", async () => {
      const categorical =
        "Alpha performance carries outsized weight in overall economics.";
      mockClaudeJson({
        ...safe,
        direct_answer: categorical,
        cited_claim_tags: ["OB-K1", "OB-K2"],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [
            {
              ...source,
              key_insights: [
                ...source.key_insights,
                { ...source.key_insights[0], statement: categorical },
              ],
            },
          ],
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What do we know about the business?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer.directAnswer).toContain(categorical);
    });
  });

  it.each([
    "**Evidence:** Original interview transcripts are unverified in this Home record; request them before discovery conclusions.",
    "**Discovery:** Interview service owners to establish the current baseline before assessing the user's proposed target.",
  ])(
    "admits missing interview references and future discovery requests: %s",
    async (point) => {
      mockClaudeJson({
        status: "partial",
        direct_answer:
          "Charter discovery only after establishing the evidence baseline.",
        key_points: [
          point,
          "**Context:** Inspect the current technology dependency.",
          "**Decision:** Verify business fit with accountable owners.",
        ],
        cited_claim_tags: ["TD-K1"],
        caveats: [],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS, declaredSyntheticDemo: true },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question:
          "Give three short points for discovery and identify missing interview references.",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer.prose?.replace(/\*\*/g, "")).toContain(
        point.replace(/\*\*/g, ""),
      );
      expect(answer.directAnswer).not.toContain("couldn't safely");
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it("does not let a safe interview gap license actual testimony", async () => {
    mockClaudeJson({
      status: "partial",
      direct_answer: "Review the leadership evidence before acting.",
      key_points: [
        "**Evidence:** Original interview transcripts are unverified; all 44 leaders raised data trust concerns.",
      ],
      cited_claim_tags: ["LP-K1"],
      caveats: [],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [...CHAPTERS, leadershipChapter],
        declaredSyntheticDemo: true,
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question: "What leadership evidence is available?",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    expect(answer.prose).toBeUndefined();
    expect(answer.directAnswer).toContain("couldn't safely");
  });

  it("states the original-reference limit when the request needs source titles or document references", async () => {
    mockClaudeJson({ ...referenceAnswer });
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [...CHAPTERS, leadershipChapter],
        declaredSyntheticDemo: true,
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question:
        "What context supports discovery? Give original source/page/date references, or say when unavailable.",
    });
    expect(answer.caveats.map((caveat) => caveat.detail)).toContain(
      "Original source title/page/passage/date references are not verified here; Evidence basis identifies Home claims or record references.",
    );
    expect(answer.citations.map((citation) => citation.id)).toContain("LP-K1");
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
  });

  it("keeps source-date disclosure on the claim-backed recovery path", async () => {
    mockClaudeJson({ status: "no_data", cited_claim_tags: [], caveats: [] });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question:
        "What technology context should the CFO know? Provide source dates.",
    });
    expect(answer.status).toBe("partial");
    expect(answer.citations.map((citation) => citation.id)).toContain("TD-K1");
    expect(answer.caveats.map((caveat) => caveat.id)).toContain(
      "home-original-reference-limit",
    );
  });

  it.each([true, false, undefined])(
    "uses the registry's declared reference basis (%s), not the tenant alias",
    async (declaredSyntheticDemo) => {
      mockClaudeJson(referenceAnswer);
      await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What should leadership verify?",
      });
      const prompt = mockGetAuditedAnthropicClient.mock.calls[0][0].prompt;
      expect(prompt).toContain(
        `"synthetic_reference": ${declaredSyntheticDemo ?? "null"}`,
      );
    },
  );

  it.each([
    {
      direct_answer: "The data is trusted by few leaders.",
      key_points: ["36 of 44 leaders raised data trust concerns."],
    },
    {
      direct_answer:
        "The analytics platform carries a leadership-reported trust gap.",
      key_points: referenceAnswer.key_points,
    },
    {
      direct_answer: referenceAnswer.direct_answer,
      key_points: [
        "36 of 44 leaders flagged data trust concerns, with leadership keeping independent extracts.",
      ],
    },
    {
      direct_answer: referenceAnswer.direct_answer,
      key_points: ["Data trust concerns appear across 36 of 44 leaders."],
    },
  ])(
    "repairs unqualified reference testimony and unsupported trust-population inference: %j",
    async (unsafeWording) => {
      const unsafe = {
        ...referenceAnswer,
        ...unsafeWording,
      };
      const create = jest
        .fn()
        .mockResolvedValueOnce({
          content: [{ type: "text", text: JSON.stringify(unsafe) }],
        })
        .mockResolvedValueOnce({
          content: [{ type: "text", text: JSON.stringify(referenceAnswer) }],
        });
      mockGetAuditedAnthropicClient.mockResolvedValue({
        client: { messages: { create } },
      } as never);
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
        },
        tenantKey: "test-tenant",
        question: "What does the record say about data trust?",
      });
      expect(create).toHaveBeenCalledTimes(2);
      expect(answer.directAnswer).not.toContain("trusted by few");
      expect(
        mockGetAuditedAnthropicClient.mock.calls[1][0].metadata,
      ).toMatchObject({
        presentationRepairReasons: expect.arrayContaining([
          expect.stringContaining("Each leadership assertion"),
        ]),
      });
      expect(create.mock.calls[1][0].messages[0].content).toContain(
        "in EACH affected point",
      );
      expect(answer.directAnswer).not.toContain("leadership-reported");
      expect(answer.prose).toContain("Modelled responses");
      expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it.each([
    {
      direct_answer: "Data trust needs verification.",
      key_points: ["36 of 44 leaders raised data trust concerns."],
    },
    {
      direct_answer: "Modelled responses show data is trusted by few leaders.",
      key_points: referenceAnswer.key_points,
    },
    {
      direct_answer:
        "The analytics platform carries a leadership-reported trust gap.",
      key_points: referenceAnswer.key_points,
    },
    {
      direct_answer: referenceAnswer.direct_answer,
      key_points: [
        "36 of 44 leaders flagged data trust concerns, with leadership keeping independent extracts.",
      ],
    },
    {
      direct_answer: referenceAnswer.direct_answer,
      key_points: ["Data trust concerns appear across 36 of 44 leaders."],
    },
  ])(
    "withholds unsafe reference wording when the bounded repair cannot qualify it",
    async (unsafe) => {
      mockClaudeJson({ ...referenceAnswer, ...unsafe });
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
        },
        tenantKey: "test-tenant",
        question: "What does the record say about data trust?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
      expect(answer.status).toBe("partial");
      expect(answer.directAnswer).toContain("evidence qualifications");
      expect(answer.prose).toBeUndefined();
      expect(answer.artifacts).toEqual([]);
      expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
    },
  );

  it.each([false, undefined])(
    "does not relabel undeclared or non-reference testimony (%s)",
    async (declaredSyntheticDemo) => {
      mockClaudeJson({
        ...referenceAnswer,
        key_points: ["36 of 44 leaders raised data trust concerns."],
      });
      await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What do the interviews say?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "Did the CEO actually say these words in a real interview, or are these modelled responses?",
    "Are these leadership quotations client-attested?",
    "Are these responses synthetic or transcribed from interviews?",
    "Can you confirm whether these interview responses are synthetic?",
    "Please verify whether these quotations are client-attested.",
    "Are these quotations about our strategic plan client-attested?",
    "Are these responses actual statements of what leaders said?",
  ])(
    "answers reference-basis questions from the record declaration: %s",
    async (question) => {
      mockGetAuditedAnthropicClient.mockRejectedValue(new Error("unavailable"));
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
          provenance: {
            canonical_snapshot_hash: "reference-record-version",
            home_synthesis_contract_version: "test",
            thesis_prompt_version: "test",
            chapter_prompt_version: "test",
            model: "test",
            signal_packet_version: "test",
            verification_version: "test",
            generated_at: "2026-10-13T00:00:00Z",
            generation_commit_sha: null,
            generation_image_digest: null,
          },
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question,
      });
      expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
      expect(answer.status).toBe("partial");
      expect(answer.directAnswer).toContain("modelled reference material");
      expect(answer.directAnswer).toContain("not verified quotations");
      expect(answer.prose).toBeUndefined();
      expect(answer.citations[0].recordId).toBe("reference-record-version");
      expect(answer.gaps[0].label).toBe("Quotation not verified");
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it.each([false, undefined])(
    "does not infer reference or real-interview status from an alias (%s)",
    async (declaredSyntheticDemo) => {
      mockClaudeJson({ status: "no_data", cited_claim_tags: [] });
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Did the CEO actually say these words in a real interview?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer.status).toBe("no_data");
      expect(answer.citations).toEqual([]);
      expect(answer.prose).toBeUndefined();
      expect(answer.directAnswer).not.toContain("synthetic reference");
    },
  );

  it.each([
    "For our existing business opportunity, what evidence is missing before chartering discovery? Distinguish sourced facts, synthetic examples, assumptions and missing evidence; say when original source/page/date references are unavailable.",
    "What should the CFO prioritize? Use modelled responses only as synthetic examples, not actual testimony.",
    "Explore the opportunity using synthetic reference context and say what evidence is missing.",
    "Are these leadership quotations client-attested? What should the CFO prioritize?",
    "How do the modelled interview responses inform business priorities?",
    "Are these quotations synthetic, and how should the CFO prioritize the opportunity?",
    "Are these quotations synthetic? Outline the discovery plan.",
  ])(
    "keeps mixed business and basis requests on the grounded answer path: %s",
    async (question) => {
      mockClaudeJson(referenceAnswer);
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question,
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer.directAnswer).toBe(referenceAnswer.direct_answer);
      expect(answer.citations.map((citation) => citation.id)).toContain(
        "LP-K1",
      );
      expect(answer.prose).toContain("Modelled responses");
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it.each(["unparseable", "unavailable", "no_data", "uncited"])(
    "keeps reference recovery behind the qualification gate (%s)",
    async (failure) => {
      if (failure === "unavailable") {
        mockGetAuditedAnthropicClient.mockRejectedValue(
          new Error("unavailable"),
        );
      } else if (failure === "unparseable") {
        mockGetAuditedAnthropicClient.mockResolvedValue({
          client: {
            messages: {
              create: jest.fn().mockResolvedValue({
                content: [{ type: "text", text: "not json" }],
              }),
            },
          },
        } as never);
      } else {
        mockClaudeJson({
          status: failure === "no_data" ? "no_data" : "answered",
          direct_answer: "Verification is incomplete.",
          cited_claim_tags: [],
        });
      }
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [
            ...CHAPTERS,
            {
              ...leadershipChapter,
              key_insights: [
                {
                  ...leadershipChapter.key_insights[0],
                  statement:
                    "All 44 leaders interviewed raised data trust concerns.",
                },
              ],
            },
          ],
          declaredSyntheticDemo: true,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "What should leadership verify before acting?",
      });
      expect(answer.status).toBe("no_data");
      expect(answer.directAnswer).toContain("concise, qualified summary");
      expect(answer.prose).toBeUndefined();
      expect(answer.artifacts).toEqual([]);
      expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it("retains short, explicitly qualified reference recovery claims", async () => {
    mockGetAuditedAnthropicClient.mockRejectedValue(new Error("unavailable"));
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [...CHAPTERS, leadershipChapter],
        declaredSyntheticDemo: true,
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question: "What should leadership verify before acting?",
    });
    expect(answer.status).toBe("partial");
    expect(answer.prose).toContain("Modelled reference responses");
    expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
  });

  it("repairs malformed output through the existing single audited correction", async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: '{"status":"answered","direct_answer":"unfinished',
          },
        ],
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(referenceAnswer) }],
      });
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: { messages: { create } },
    } as never);
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [...CHAPTERS, leadershipChapter],
        declaredSyntheticDemo: true,
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question: "Talk to me about the current state of data analytics",
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    expect(
      mockGetAuditedAnthropicClient.mock.calls[1][0].metadata,
    ).toMatchObject({ presentationRepair: true });
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "Return the complete JSON schema.",
    );
    expect(answer.status).toBe("answered");
    expect(answer.prose).toContain("Modelled responses");
    expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it.each([
    "not json",
    JSON.stringify({
      ...referenceAnswer,
      key_points: ["All 44 leaders interviewed raised data trust concerns."],
    }),
    JSON.stringify({ ...referenceAnswer, status: "no_data" }),
    JSON.stringify({ ...referenceAnswer, cited_claim_tags: ["UNKNOWN-CLAIM"] }),
    JSON.stringify({
      ...referenceAnswer,
      key_points: [
        `**Leadership:** Modelled responses ${"need verification ".repeat(25)}.`,
      ],
    }),
  ])(
    "does not chain another correction or publish unsafe repaired material",
    async (repairText) => {
      const create = jest
        .fn()
        .mockResolvedValueOnce({
          content: [{ type: "text", text: '{"direct_answer":"unfinished' }],
        })
        .mockResolvedValueOnce({
          content: [{ type: "text", text: repairText }],
        });
      mockGetAuditedAnthropicClient.mockResolvedValue({
        client: { messages: { create } },
      } as never);
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
        },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Talk to me about the current state of data analytics",
      });
      expect(create).toHaveBeenCalledTimes(2);
      expect(answer.status).toBe("no_data");
      expect(answer.directAnswer).not.toContain("unfinished");
      expect(answer.prose).toBeUndefined();
      expect(answer.artifacts).toEqual([]);
      expect(answer.citations).toEqual([]);
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it.each(["insufficient", "consumed_by_audit"])(
    "keeps malformed-output correction inside the original deadline (%s)",
    async (budget) => {
      const now = jest.spyOn(Date, "now").mockReturnValueOnce(0);
      if (budget === "insufficient") now.mockReturnValue(44_001);
      else now.mockReturnValueOnce(40_000).mockReturnValue(46_000);
      try {
        const create = jest.fn().mockResolvedValue({
          content: [{ type: "text", text: '{"direct_answer":"unfinished' }],
        });
        mockGetAuditedAnthropicClient.mockResolvedValue({
          client: { messages: { create } },
        } as never);
        const answer = await answerHomeAvaQuestion({
          bundle: { chapters: CHAPTERS },
          tenantKey: CANONICAL_TENANT_KEYS[0],
          question: "Talk to me about the current state of data analytics",
        });
        expect(create).toHaveBeenCalledTimes(
          budget === "consumed_by_audit" ? 0 : 1,
        );
        expect(answer.status).toBe("no_data");
        expect(answer.prose).toBeUndefined();
      } finally {
        now.mockRestore();
      }
    },
  );

  it.each(["answered", "no_data"])(
    "does not publish unsafe testimony without citations (%s)",
    async (status) => {
      mockClaudeJson({
        ...referenceAnswer,
        status,
        key_points: ["36 of 44 leaders raised data trust concerns."],
        cited_claim_tags: [],
      });
      const answer = await answerHomeAvaQuestion({
        bundle: {
          chapters: [...CHAPTERS, leadershipChapter],
          declaredSyntheticDemo: true,
        },
        tenantKey: "test-tenant",
        question: "What do the interviews say?",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
      expect(answer.directAnswer).toContain("evidence qualifications");
      expect(answer.prose).toBeUndefined();
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it("retains a short labelled next step alongside the supporting points", async () => {
    mockClaudeJson({
      ...referenceAnswer,
      prose:
        "**Next step:** Verify the underlying data before making an investment decision.",
    });
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [...CHAPTERS, leadershipChapter],
        declaredSyntheticDemo: true,
      },
      tenantKey: "test-tenant",
      question: "What should leadership verify?",
    });
    expect(answer.prose).toContain("**Next step:**");
    expect(answer.prose).toContain("**Leadership:**");
    expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
  });

  it("repairs excess default points instead of silently dropping the fifth business issue", async () => {
    const points = [
      "**One:** Verify value proof.",
      "**Two:** Review evidence.",
      "**Three:** Check ownership.",
      "**Four:** Validate outcomes.",
      "**Five:** Confirm assumptions.",
    ];
    const initial = { ...referenceAnswer, key_points: points };
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(initial) }],
      })
      .mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...initial,
              key_points: points.slice(0, 4),
            }),
          },
        ],
      });
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: { messages: { create } },
    } as never);
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: [...CHAPTERS, leadershipChapter] },
      tenantKey: "test-tenant",
      question: "What should leadership verify?",
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(answer.prose?.match(/^-/gm)).toHaveLength(4);
  });

  it("does not restore unsanitized internal terms when preserving bold labels", async () => {
    mockClaudeJson({
      ...referenceAnswer,
      key_points: ["**source_record_id:** Verify APP-001 before acting."],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: [...CHAPTERS, leadershipChapter] },
      tenantKey: "test-tenant",
      question: "What should be verified?",
    });
    expect(answer.prose).not.toContain("source_record_id");
    expect(answer.prose).not.toContain("APP-001");
    expect(answer.prose).toContain("**source reference:**");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("answers visible family row counts without asking a model", async () => {
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question:
        "How many Vendor Contracts and Data Assets & Integrations are in the record on screen?",
    });
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
    expect(answer.status).toBe("answered");
    expect(answer.directAnswer).toBe(
      "Vendor Contracts: 230; Data Assets & Integrations: 1710.",
    );
    expect(answer.artifacts[0]).toMatchObject({
      rows: [
        { family: "Vendor Contracts", rows: 230 },
        { family: "Data Assets & Integrations", rows: 1710 },
      ],
    });
    expect(answer.caveats[0].detail).toContain("not unique vendors");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("keeps missing families unknown rather than manufacturing zero", async () => {
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS },
      tenantKey: "test-tenant",
      question: "How many vendor contracts are in the record?",
    });
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
    expect(answer.status).toBe("no_data");
    expect(answer.directAnswer).toContain("not supplied");
    expect(answer.gaps[0].detail).toContain("unknown, not zero");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("keeps the explicit enterprise-total exclusion on the visible-row path", async () => {
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      recordSource: {
        kind: "reviewed_snapshot",
        canonicalSnapshotHash: "record-count-version-test",
      },
      question:
        "How many Vendor Contracts and Data Assets & Integrations are in the record on screen? Include the record source and do not infer enterprise totals.",
    });
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
    expect(answer.status).toBe("answered");
    expect(answer.directAnswer).toBe(
      "Vendor Contracts: 230; Data Assets & Integrations: 1710. Record source: Reviewed stored record.",
    );
    expect(answer.artifacts[0]).toMatchObject({
      rows: [
        { family: "Vendor Contracts", rows: 230 },
        { family: "Data Assets & Integrations", rows: 1710 },
      ],
    });
    expect(
      answer.citations.every(
        (citation) => citation.recordId === "record-count-version-test",
      ),
    ).toBe(true);
    expect(answer.caveats[0].detail).toContain("not unique vendors");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it.each([
    ["reviewed_snapshot", "Reviewed stored record"],
    ["reviewed_snapshot_fallback", "Reviewed stored record fallback"],
    ["ecl_serving_projection", "Live governed rows"],
  ] as const)(
    "answers conversational counts using the actual %s source",
    async (kind, label) => {
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        recordSource: {
          kind,
          canonicalSnapshotHash: "record-count-version-test",
        },
        question:
          "For the record currently on screen, how many vendor contracts and data assets/integrations are available? State the record source. Use two short bullets; do not substitute another assessment or version.",
      });
      expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
      expect(answer.status).toBe("answered");
      expect(answer.directAnswer).toBe(`Record on screen: ${label}.`);
      expect(answer.prose).toBe(
        "- Vendor Contracts: 230 rows.\n- Data Assets & Integrations: 1710 rows.",
      );
      expect(answer.citations).toHaveLength(2);
      expect(
        answer.citations.every(
          (citation) => citation.recordId === "record-count-version-test",
        ),
      ).toBe(true);
      expect(validateAvaAnswerPacket(answer).passed).toBe(true);
    },
  );

  it("does not invent a record source when only counts are available", async () => {
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question:
        "How many vendor contracts are currently available? State the record source.",
    });
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
    expect(answer.status).toBe("partial");
    expect(answer.directAnswer).toContain("Record source: not supplied");
    expect(answer.directAnswer).not.toContain("Live governed record");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it.each([
    "How many critical vendor contracts are currently available? Use two short bullets.",
    "How many vendor contracts are available and why are they our biggest exposure? State the record source.",
    "How many vendor contracts were added since last quarter? Use two short bullets.",
  ])(
    "does not replace a filtered, interpretive or historical question with a total: %s",
    async (question) => {
      mockClaudeJson({
        status: "no_data",
        direct_answer: "Unknown",
        cited_claim_tags: [],
        visual: { type: "none" },
        caveats: ["Requested basis is not established."],
      });
      await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question,
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalled();
    },
  );

  it("does not treat unique vendors or spend as family row counts", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer: "Unknown",
      cited_claim_tags: [],
      visual: { type: "none" },
      caveats: ["No unique vendor basis."],
    });
    await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question:
        "How many unique vendors are represented by the vendor contracts?",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalled();
  });

  it("does not answer a filtered count with the whole family total", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer: "Unknown",
      cited_claim_tags: [],
      visual: { type: "none" },
      caveats: ["Criticality is not established."],
    });
    await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question:
        "How many critical vendor contracts are in the record on screen?",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalled();
  });

  it("preserves separate structured key points and their citations", async () => {
    mockClaudeJson({
      status: "partial",
      direct_answer: "Focus on integration dependence and value proof.",
      prose: "Do not repeat this paragraph when structured points exist.",
      key_points: [
        "Epic Hyperspace Production integrates with 80 other systems.",
        "Only 23 of 50 tracked metrics are claimable or ready.",
        "Finance attestation does not cover every value claim.",
      ],
      cited_claim_tags: ["TD-K1", "PV-K1"],
      visual: { type: "none" },
      caveats: ["Source-owner confirmation is still required."],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question: "Give me three concise bullets about technology and value.",
    });
    expect(answer.prose?.match(/^-/gm)).toHaveLength(3);
    expect(answer.prose).not.toContain("Do not repeat");
    expect(answer.citations.map((citation) => citation.id)).toEqual([
      "TD-K1",
      "PV-K1",
    ]);
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("does not collapse a legacy single-newline bullet list during sanitization", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "Check value proof.",
      prose:
        "- Only 23 of 50 tracked metrics are claimable or ready.\n- Finance attestation does not cover every value claim.",
      cited_claim_tags: ["PV-K1"],
      visual: { type: "none" },
      caveats: [],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question: "Summarize the available proof.",
    });
    expect(answer.prose?.match(/^-/gm)).toHaveLength(2);
  });

  it("repairs overlong points once using the same admitted context", async () => {
    const longPoint = `${"Supporting evidence remains incomplete. ".repeat(9)}Finance has not attested the value.`;
    const initial = {
      status: "partial",
      direct_answer: "Check the value proof.",
      key_points: [longPoint],
      cited_claim_tags: ["PV-K1"],
      caveats: ["Finance attestation remains incomplete."],
    };
    const repaired = {
      ...initial,
      status: "answered",
      caveats: [],
      key_points: [
        "Only 23 of 50 tracked metrics are claimable or ready (PV-K1).",
        "Finance attestation does not cover every value claim.",
        "Review integration dependence alongside value proof (TD-K1).",
      ],
      cited_claim_tags: ["PV-K1", "TD-K1"],
    };
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(initial) }],
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(repaired) }],
      });
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: { messages: { create } },
    } as never);
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question: "Give me three concise bullets about technology and value.",
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    expect(mockGetAuditedAnthropicClient.mock.calls[1][0]).toMatchObject({
      tenantId: "test-tenant",
      metadata: { presentationRepair: true },
    });
    const firstMessage = create.mock.calls[0][0].messages[0].content;
    expect(create.mock.calls[1][0].messages[0].content).toContain(firstMessage);
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "Constraints requiring correction:",
    );
    expect(
      mockGetAuditedAnthropicClient.mock.calls[1][0].metadata,
    ).toMatchObject({
      presentationRepairReasons: expect.arrayContaining([
        expect.stringContaining("Return 3 supporting points"),
      ]),
    });
    expect(answer.prose?.match(/^-/gm)).toHaveLength(3);
    expect(maxParagraphWords(answer.prose)).toBeLessThanOrEqual(31);
    expect(answer.prose).not.toMatch(/PV-K1|TD-K1/);
    expect(answer.citations.map((citation) => citation.id)).toEqual([
      "PV-K1",
      "TD-K1",
    ]);
    expect(answer.caveats[0].detail).toContain("incomplete");
    expect(answer.status).toBe("partial");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("keeps the default supporting-point limit a maximum during repair", async () => {
    const initial = {
      status: "answered",
      direct_answer: "Review the value evidence.",
      key_points: Array.from(
        { length: 5 },
        () => "Value evidence needs review.",
      ),
      cited_claim_tags: ["PV-K1"],
    };
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(initial) }],
      })
      .mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...initial,
              key_points: ["Value evidence needs review."],
            }),
          },
        ],
      });
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: { messages: { create } },
    } as never);
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question: "Summarize the value evidence.",
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "Return at most 4 supporting points",
    );
    expect(answer.prose?.match(/^-/gm)).toHaveLength(1);
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("preserves a complete qualified point after the bounded shortening attempt", async () => {
    const statement =
      "The published value summary describes the tracked portfolio only and requires owner review before use in a funding decision; accountable owners must verify the stated acceptance limits and supporting evidence before acting on its findings.";
    const point = `**Scope:** ${statement}`;
    expect(point.split(/\s+/).length).toBeGreaterThan(30);
    expect(point.split(/\s+/).length).toBeLessThanOrEqual(45);
    mockClaudeJson({
      status: "partial",
      direct_answer: "Review the stated portfolio and acceptance limits.",
      key_points: [
        point,
        "**Basis:** Inspect the published claim before acting.",
        "**Decision:** Verify owner acceptance before a funding decision.",
      ],
      cited_claim_tags: ["PV-K1"],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: [
          {
            ...CHAPTERS[1],
            key_insights: [
              {
                statement,
                evidence_ids: ["reference"],
                confidence: "medium",
                claim_type: "FACT",
              },
            ],
          },
        ],
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question: "Give three short points about value proof.",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    expect(answer.directAnswer).not.toContain("couldn't safely");
    expect(answer.prose).toContain(statement);
    expect(answer.prose?.match(/^-/gm)).toHaveLength(3);
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("never admits unsupported quantities through the qualified-point budget", async () => {
    const point =
      "**Baseline:** The current baseline is 91% resolution and must be reviewed with accountable owners before any funding decision, because the published record does not yet establish independently accepted benefits or savings for the enterprise.";
    expect(point.split(/\s+/).length).toBeGreaterThan(30);
    expect(point.split(/\s+/).length).toBeLessThanOrEqual(45);
    mockClaudeJson({
      status: "partial",
      direct_answer: "Review the baseline.",
      key_points: [
        point,
        "**Basis:** Inspect the record.",
        "**Decision:** Establish the baseline before funding.",
      ],
      cited_claim_tags: ["PV-K1"],
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS },
        tenantKey: CANONICAL_TENANT_KEYS[0],
        question: "Give three short points about the baseline.",
      });
      expect(answer.prose).toBeUndefined();
      expect(answer.directAnswer).toContain("couldn't safely");
      const log = warn.mock.calls
        .map(([message]) => String(message))
        .find((message) => message.includes("home_ava.answer_withheld"));
      expect(log).toBeDefined();
      expect(JSON.parse(log!)).toMatchObject({
        reasons: expect.arrayContaining([
          expect.stringContaining("Quantities"),
        ]),
      });
      expect(log).not.toContain(point);
      expect(log).not.toContain("91%");
    } finally {
      warn.mockRestore();
    }
  });

  it("checks point length after stale-count sanitization expands the visible wording", async () => {
    mockClaudeJson({
      status: "partial",
      direct_answer: "Check the data evidence.",
      key_points: [
        `395 of 540 data assets ${"require review ".repeat(12)}`.trim(),
        "Integration dependence needs review.",
        "Finance attestation is incomplete.",
      ],
      cited_claim_tags: ["PV-K1"],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "test-tenant",
      question: "Give me three concise bullets about data.",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    expect(
      mockGetAuditedAnthropicClient.mock.calls[1][0].metadata,
    ).toMatchObject({
      presentationRepairReasons: expect.arrayContaining([
        expect.stringContaining("Each complete supporting point"),
      ]),
    });
    expect(answer.prose).toBeUndefined();
    expect(answer.directAnswer).toContain("concise summary");
  });

  it("reports a presentation gap without truncating qualifiers after a failed repair", async () => {
    mockClaudeJson({
      status: "partial",
      direct_answer: "Review value proof.",
      key_points: [
        `${"Recorded measures require careful review. ".repeat(8)}This is not Finance-attested value.`,
      ],
      cited_claim_tags: ["PV-K1"],
      caveats: ["Finance attestation does not cover every value claim."],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS },
      tenantKey: "test-tenant",
      question: "Give me three concise bullets about value.",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(2);
    expect(answer.status).toBe("partial");
    expect(answer.directAnswer).toContain(
      "couldn't safely produce a concise summary",
    );
    expect(answer.prose).toBeUndefined();
    expect(answer.citations[0].excerpt).toBe(
      CHAPTERS[1].key_insights[0].statement,
    );
    expect(answer.gaps.map(gap => gap.detail).join(" ")).toContain("attestation");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("does not adopt a concise repair that has no valid citations", async () => {
    const initial = {
      status: "partial",
      key_points: ["A detailed answer remains necessary."],
      cited_claim_tags: ["PV-K1"],
    };
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(initial) }],
      })
      .mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "answered",
              key_points: [
                "Unsupported first claim.",
                "Unsupported second claim.",
                "Unsupported third claim.",
              ],
              cited_claim_tags: ["PV-K999"],
            }),
          },
        ],
      });
    mockGetAuditedAnthropicClient.mockResolvedValue({
      client: { messages: { create } },
    } as never);
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS },
      tenantKey: "test-tenant",
      question: "Give me three concise bullets about value.",
    });
    expect(answer.directAnswer).not.toContain("Unsupported");
    expect(answer.prose).toBeUndefined();
    expect(answer.citations.map((citation) => citation.id)).toEqual(["PV-K1"]);
  });

  it("does not reset the request deadline for a presentation repair", async () => {
    mockClaudeJson({
      status: "partial",
      key_points: ["Value proof is incomplete."],
      cited_claim_tags: ["PV-K1"],
    });
    const now = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValue(44_000);
    try {
      const answer = await answerHomeAvaQuestion({
        bundle: { chapters: CHAPTERS },
        tenantKey: "test-tenant",
        question: "Give me three concise bullets about value.",
      });
      expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
      expect(answer.directAnswer).toContain(
        "couldn't safely produce a concise summary",
      );
    } finally {
      now.mockRestore();
    }
  });

  it("suppresses inline claim codes without removing source citations or business names", async () => {
    mockClaudeJson({
      status: "partial",
      direct_answer: "Check value proof (PV-K1).",
      key_points: [
        "Review Epic Hyperspace integration dependence [TD-K1].",
        "Only 23 of 50 metrics are claimable or ready (PV-K1, TD-K1).",
        "Finance attestation is incomplete (PV-K1).",
      ],
      cited_claim_tags: ["PV-K1", "TD-K1"],
      caveats: ["Do not treat this as approval (PV-K1)."],
    });
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS },
      tenantKey: "test-tenant",
      question: "Give me three concise bullets.",
    });
    expect(mockGetAuditedAnthropicClient).toHaveBeenCalledTimes(1);
    expect(
      [answer.directAnswer, answer.prose, answer.caveats[0].detail].join(" "),
    ).not.toMatch(/PV-K1|TD-K1|\(\)|\[\]/);
    expect(answer.prose).toContain("Epic Hyperspace");
    expect(answer.citations.map((citation) => citation.id)).toEqual([
      "PV-K1",
      "TD-K1",
    ]);
  });

  it("packages a grounded answer, resolving a cited tag to its real claim text", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer:
        "Epic Hyperspace Production is the most connected system, with 80 integrations.",
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
    expect(answer.citations[0].excerpt).toBe(
      "Epic Hyperspace Production integrates with 80 other systems.",
    );
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

    expect(answer.citations.map((citation) => citation.id)).toEqual([
      "TD-K1",
      "PV-K1",
    ]);
    expect(answer.citations[1].excerpt).toBe(
      "Only 23 of 50 tracked metrics are claimable or ready.",
    );
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
    expect(prompt).toContain(
      "enterprise_context_spine and record_summaries are orientation and routing context",
    );
    expect(prompt).toContain(
      "Tagged chapter claims are factual answer material",
    );
    expect(prompt).toContain(
      "Deterministic plottable_datasets are quantitative exhibit material",
    );
    expect(prompt).toContain("Use compact consulting structure");
    expect(prompt).not.toContain("scoped_to_active_chapter");
  });

  it("does not send stale supplier-pair concentration claims to the model", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer: "Use the current vendor register.",
      prose: "",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const chapters: ChapterView[] = [
      {
        ...CHAPTERS[0],
        key_insights: [
          CHAPTERS[0].key_insights[0],
          {
            statement:
              "Outdated Supplier and Legacy Supplier together represent over a quarter of vendor spend.",
            evidence_ids: ["ctx_stale"],
            confidence: "high",
            claim_type: "FACT",
          },
        ],
        executive_synthesis:
          "Outdated Supplier and Legacy Supplier together represent over a quarter of vendor spend. Current supplier concentration should be checked separately.",
      },
    ];

    await answerHomeAvaQuestion({
      bundle: {
        chapters,
        technologyEstate: TECHNOLOGY_ESTATE_WITH_VENDOR_SPEND,
      },
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
    });

    const prompt = mockGetAuditedAnthropicClient.mock.calls[0][0].prompt;
    expect(prompt).not.toContain("Outdated Supplier and Legacy Supplier");
    expect(prompt).not.toContain('"TD-K2"');
    expect(prompt).toContain("Current supplier concentration");
  });

  it("scrubs stale supplier-pair concentration wording from visible model prose", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer:
        "Outdated Supplier and Legacy Supplier together represent over a quarter of vendor spend.",
      prose:
        "Outdated Supplier and Legacy Supplier together represent over a quarter of vendor spend.",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: CHAPTERS,
        technologyEstate: TECHNOLOGY_ESTATE_WITH_VENDOR_SPEND,
      },
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
    });

    expect(answer.directAnswer).not.toContain(
      "Outdated Supplier and Legacy Supplier",
    );
    expect(answer.prose).not.toContain("Outdated Supplier and Legacy Supplier");
    expect(answer.directAnswer).toContain("current Vendor Contracts table");
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
    expect(answer.citations.map((citation) => citation.id)).toContain(
      "tech.application_system.by_businessFunction",
    );
    expect(answer.prose).toBeUndefined();
    expect(answer.gaps[0]?.detail).toContain("recorded counts");
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
      visual: {
        type: "chart",
        dataset_ref: "tech.vendor_contract.by_vendorTier",
        chart_kind: "bar",
      },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "irrelevant",
    });

    expect(answer.artifacts).toHaveLength(0);
  });

  it("does not ask the model to fabricate a graph when Home has no graph view", async () => {
    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question:
        "Show me the graph of how risks, vendors, applications, data and programs connect.",
    });

    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
    expect(answer.status).toBe("partial");
    expect(answer.directAnswer).toContain("cannot render a graph");
    expect(answer.artifacts).toHaveLength(0);
    expect(answer.gaps[0].label).toBe("Graph view unavailable");
    expect(answer.prose).toContain("Confidence:");
    expect(answer.prose?.match(/^- /gm)).toHaveLength(3);
    expect(answer.prose?.split(/\s+/).length).toBeLessThan(100);
    expect(answer.prose).not.toContain("Endpoint IDs");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("does not use stale supplier-pair concentration claims in the graph fallback", async () => {
    const chapters: ChapterView[] = [
      {
        ...CHAPTERS[0],
        key_insights: [
          {
            statement:
              "Outdated Supplier and Legacy Supplier together represent over a quarter of vendor spend.",
            evidence_ids: ["ctx_stale"],
            confidence: "high",
            claim_type: "FACT",
          },
          CHAPTERS[0].key_insights[0],
        ],
      },
    ];

    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters,
        technologyEstate: TECHNOLOGY_ESTATE_WITH_VENDOR_SPEND,
      },
      tenantKey: "meridian-health",
      question:
        "Show me the graph of how risks, vendors, applications, data and programs connect.",
    });

    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
    expect(answer.prose).not.toContain("Outdated Supplier and Legacy Supplier");
    expect(answer.citations.map((citation) => citation.id)).toEqual(["TD-K2"]);
  });

  it("withholds an uncited whole-family absence claim rather than replacing its count", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer:
        "Commercial exposure is concentrated in vendor dependencies.",
      prose: "",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [
        "Vendor contract evidence is absent for all 72 declared vendor contracts.",
      ],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
    });

    expect(answer.caveats).toEqual([]);
    expect(answer.prose).toBeUndefined();
    expect(answer.directAnswer).toContain("evidence qualifications");
  });

  it("withholds an uncited total-universe contract evidence assertion", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer:
        "Commercial exposure is concentrated in vendor dependencies.",
      prose: "",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [
        "None of the 72 vendor contracts have extractable pricing or SLA evidence.",
      ],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question:
        "I'm on Technology & Data. What should the CFO care about first?",
    });

    expect(answer.caveats).toEqual([]);
    expect(answer.prose).toBeUndefined();
  });

  it("does not publish an internally worded uncited family count caveat", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer:
        "Commercial exposure is concentrated in vendor dependencies.",
      prose: "",
      cited_claim_tags: ["TD-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [
        "The ECL projection and source rows are incomplete for all 72 declared vendor contracts.",
      ],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
    });

    expect(answer.caveats).toEqual([]);
    expect(answer.prose).toBeUndefined();
    expect(answer.gaps).toHaveLength(1);
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("recovers from cited claims without reintroducing an uncited model caveat", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer: "Not enough data.",
      prose: "",
      cited_claim_tags: [],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [
        "Vendor contract evidence (pricing, SLA history) is absent for all 72 declared contracts, so exposure beyond spend concentration cannot be quantified.",
      ],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
    });

    expect(answer.status).toBe("partial");
    expect(answer.prose).not.toContain("all 230 declared vendor contracts");
    expect(answer.prose).not.toContain("72 declared");
    expect(answer.caveats.map((caveat) => caveat.detail)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("72 declared")]),
    );
  });

  it("compacts overlong model paragraphs before packaging the preview answer", async () => {
    const longSentence = Array.from(
      { length: 145 },
      (_value, index) => `word${index + 1}`,
    ).join(" ");
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
      question:
        "Where are we commercially exposed, and what evidence supports that?",
    });

    expect(answer.status).toBe("answered");
    expect(maxParagraphWords(answer.directAnswer)).toBeLessThanOrEqual(55);
    expect(maxParagraphWords(answer.prose)).toBeLessThanOrEqual(70);
    expect(answer.prose).toContain("\n\n");
    expect(answer.citations.map((citation) => citation.id)).toEqual([
      "TD-K1",
      "PV-K1",
    ]);
  });

  it("withholds persistent unsupported quantitative claims before export validation", async () => {
    mockClaudeJson({
      status: "answered",
      direct_answer:
        "Commercial exposure is concentrated where unsupported economics reach 70% of the business.",
      prose:
        "Use the cited material for direction, but do not treat this as final approval evidence.",
      cited_claim_tags: ["TD-K1", "PV-K1"],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: [],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question:
        "Where are we commercially exposed, and what evidence supports that?",
    });

    expect(answer.status).toBe("partial");
    expect(answer.directAnswer).not.toContain("70%");
    expect(answer.gaps).toHaveLength(1);
    expect(answer.prose).toBeUndefined();
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("honors an honest no_data status rather than forcing an answer", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer:
        "That isn't covered in what I have available for this tenant yet.",
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

  it("does not package uncited narrative when the model reports no data", async () => {
    mockClaudeJson({
      status: "no_data",
      direct_answer: "I cannot compare reviews, but 27 programs are off track.",
      prose: "Those 27 programs require leadership action now.",
      cited_claim_tags: [],
      visual: { type: "none", dataset_ref: null, chart_kind: null },
      caveats: ["27 programs were counted in an older review."],
    });

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "What changed since the last governed review?",
    });

    expect(answer.status).toBe("no_data");
    expect(answer.directAnswer).not.toContain("27 programs");
    expect(answer.prose).toBeUndefined();
    expect(answer.caveats).toEqual([]);
    expect(answer.artifacts).toEqual([]);
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("keeps stored chapter prose out of aVa when served lineage is unverified", async () => {
    const answer = await answerHomeAvaQuestion({
      bundle: {
        chapters: CHAPTERS,
        technologyEstate: TECHNOLOGY_ESTATE,
        contextVersion: {
          assessmentId: "assessment-test",
          projectionContentHash: "rows-hash",
          sourceSetHash: null,
          sourceLineageHash: "lineage-hash",
          sourceCoverage: {
            totalRecordRows: 2,
            linkedRecordRows: 1,
            families: [
              { pageKey: "vendor_contracts", totalRows: 2, linkedRows: 1 },
            ],
          },
          sourceCatalogHash: "source-catalog-hash",
          sourceFileReview: {
            totalFiles: 14,
            acceptedFiles: 0,
            partialFiles: 14,
            blockedFiles: 0,
            supersededFiles: 0,
          },
          sourceDateCoverage: {
            earliest: "2026-08-23",
            latest: "2026-08-23",
            datedFiles: 14,
            totalFiles: 14,
          },
          deterministicPacketHash: "read-packet-hash",
          narrativePacketHash: "writer-packet-hash",
          narrativeGeneratedAt: "2026-08-21T00:00:00Z",
          dataAsOf: null,
          coherence: "unverified",
        },
      },
      tenantKey: "meridian-health",
      question: "What should leadership address first?",
    });

    expect(answer.status).toBe("no_data");
    expect(answer.directAnswer).toContain("not been verified");
    expect(answer.directAnswer).toContain(
      "Source-file quality: 0 of 14 accepted; 14 partial",
    );
    expect(answer.directAnswer).toContain(
      "Registered source dates: 2026-08-23 (14 of 14 files); data currency not attested",
    );
    expect(answer.directAnswer).toContain("incomplete for contracts");
    expect(answer.prose).toBeUndefined();
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
  });

  it("recovers broad CXO questions from cited chapter claims instead of returning generic no_data", async () => {
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
          create: jest.fn().mockResolvedValue({
            content: [{ type: "text", text: "not json at all" }],
          }),
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
          create: jest.fn().mockResolvedValue({
            content: [{ type: "text", text: "not json at all" }],
          }),
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
    expect(answer.prose).not.toMatch(
      /\b(advisor model|unparseable|JSON|parser)\b/i,
    );
    expect(answer.caveats[0].detail).not.toMatch(
      /\b(advisor model|unparseable|JSON|parser)\b/i,
    );
    expect(answer.citations.length).toBeGreaterThan(0);
  });

  it("falls back gracefully when the audited client call throws", async () => {
    mockGetAuditedAnthropicClient.mockRejectedValue(
      new Error("no ANTHROPIC_API_KEY"),
    );

    const answer = await answerHomeAvaQuestion({
      bundle: { chapters: CHAPTERS, technologyEstate: TECHNOLOGY_ESTATE },
      tenantKey: "meridian-health",
      question: "irrelevant",
    });

    expect(answer.status).toBe("no_data");
    expect(answer.gaps[0].label).toBe("Answer unavailable");
    expect(answer.gaps[0].detail).not.toContain("No cited Home evidence");
    expect(JSON.stringify(answer)).not.toContain("ANTHROPIC_API_KEY");
  });
});
