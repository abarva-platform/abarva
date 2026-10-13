import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

import { answerHomeAvaQuestion } from "../ava-answer";
import type { ChapterView, TechnologyEstateBundle } from "../types";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
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

  it("repairs unqualified reference testimony and unsupported trust-population inference", async () => {
    const unsafe = {
      ...referenceAnswer,
      direct_answer: "The data is trusted by few leaders.",
      key_points: ["36 of 44 leaders raised data trust concerns."],
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
    expect(answer.prose).toContain("Modelled responses");
    expect(answer.citations.map((c) => c.id)).toContain("LP-K1");
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it.each([
    {
      direct_answer: "Data trust needs verification.",
      key_points: ["36 of 44 leaders raised data trust concerns."],
    },
    {
      direct_answer: "Modelled responses show data is trusted by few leaders.",
      key_points: referenceAnswer.key_points,
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
    expect(answer.caveats[0].detail).toContain("attestation");
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

  it("scrubs stale family counts in model caveats against the served record counts", async () => {
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

    expect(answer.caveats[0].detail).toContain(
      "all 230 declared vendor contracts",
    );
    expect(answer.caveats[0].detail).not.toContain("72 declared");
  });

  it("scrubs stale total-universe vendor contract wording in visible model caveats", async () => {
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

    expect(answer.caveats[0].detail).toContain(
      "none of the 230 vendor contracts",
    );
    expect(answer.caveats[0].detail).not.toContain("72 vendor contracts");
  });

  it("scrubs internal terms from model caveats before the UI renders them", async () => {
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

    expect(answer.caveats[0].detail).toContain(
      "all 230 declared vendor contracts",
    );
    expect(answer.caveats[0].detail).not.toMatch(
      /\b(ECL|projection|source rows|72 declared)\b/i,
    );
    expect(answer.gaps).toHaveLength(0);
    expect(validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("scrubs stale family counts in claim-backed recovery answers", async () => {
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
    expect(answer.prose).toContain("all 230 declared vendor contracts");
    expect(answer.prose).not.toContain("72 declared");
    expect(answer.caveats[0].detail).toContain(
      "all 230 declared vendor contracts",
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

  it("recovers broad model answers that would fail export validation", async () => {
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
    expect(answer.prose).toContain("Support:");
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
    expect(
      answer.caveats.some((c) => c.detail.includes("no ANTHROPIC_API_KEY")),
    ).toBe(true);
  });
});
