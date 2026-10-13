import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

import { answerHomeAvaQuestion } from "../ava-answer";
import type { ChapterView, TechnologyEstateBundle } from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const auditedClient = jest.mocked(getAuditedAnthropicClient);
const tenantKey = CANONICAL_TENANT_KEYS[0];
const vendorClaim =
  "Two suppliers account for over a quarter of vendor spend.";
const technologyClaim =
  "Two other suppliers account for over a quarter of technology spend.";
const question = "What should be reviewed about supplier concentration?";
const tableQuestion =
  "Show a table of applications and summarize the cited supplier concentration.";
const supportingClaims = [
  vendorClaim,
  "Contract renewal dates require review before sourcing decisions.",
  "Independent financial validation is not available for the vendor summary.",
  "Contract owner acceptance remains unknown.",
];
const supportingPoints = [
  `**Concentration:** ${vendorClaim}`,
  `**Renewals:** ${supportingClaims[1]}`,
  `**Validation:** ${supportingClaims[2]}`,
  `**Ownership:** ${supportingClaims[3]}`,
];
const syntheticEstate: TechnologyEstateBundle = {
  recordTypes: [
    {
      objectType: "application_system",
      label: "Applications",
      columns: ["systemName", "businessFunction"],
      rows: [
        {
          systemName: "Example scheduling application",
          businessFunction: "Operations",
        },
        {
          systemName: "Example records application",
          businessFunction: "Operations",
        },
      ],
      primaryDimension: "businessFunction",
      dimensionCounts: [{ value: "Operations", count: 2 }],
    },
  ],
};

interface ModelReply {
  status: "answered" | "partial";
  direct_answer: string;
  key_points: string[];
  prose?: string;
  cited_claim_tags: string[];
  visual: { type: "none" | "table"; dataset_ref: string | null };
  caveats: string[];
}

function sourceChapter(statements: string[]): ChapterView {
  return {
    chapterId: "technology_data",
    title: "Synthetic reference context",
    guidingQuestion: "What does the cited source establish?",
    headline: "Keep each concentration claim on its source basis.",
    executive_synthesis: "Fictional reference evidence for regression tests.",
    key_insights: statements.map((statement, index) => ({
      statement,
      evidence_ids: [`synthetic-evidence-${index + 1}`],
      confidence: "high",
      claim_type: "FACT",
    })),
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: [],
  };
}

function reply(
  statement = vendorClaim,
  citedClaimTags = ["TD-K1"],
): ModelReply {
  return {
    status: "answered",
    direct_answer: "Review the cited supplier concentration.",
    key_points: [`**Concentration:** ${statement}`],
    cited_claim_tags: citedClaimTags,
    visual: { type: "none", dataset_ref: null },
    caveats: [],
  };
}

function mockModelReplies(initial: ModelReply, repaired = initial) {
  const message = (payload: ModelReply) => ({
    content: [{ type: "text", text: JSON.stringify(payload) }],
  });
  const create = jest
    .fn()
    .mockResolvedValueOnce(message(initial))
    .mockResolvedValue(message(repaired));
  auditedClient.mockResolvedValue({
    client: { messages: { create } },
    auditId: "synthetic-spend-basis-audit",
    dataClass: "confidential",
  } as never);
  return create;
}

function answerFromSources(
  statements = [vendorClaim],
  requestedQuestion = question,
) {
  return answerHomeAvaQuestion({
    bundle: {
      chapters: [sourceChapter(statements)],
      technologyEstate: syntheticEstate,
      declaredSyntheticDemo: true,
    },
    tenantKey,
    question: requestedQuestion,
  });
}

function expectSourceCitation(
  answer: AvaAnswerPacket,
  statement = vendorClaim,
  id = "TD-K1",
) {
  expect(answer.citations).toEqual(
    expect.arrayContaining([expect.objectContaining({ id, excerpt: statement })]),
  );
  expect(validateAvaAnswerPacket(answer).passed).toBe(true);
}

function expectWithheld(answer: AvaAnswerPacket, statement = vendorClaim) {
  expect(answer.status).toBe("partial");
  expect(answer.quality.confidence).toBe("low");
  expect(answer.quality.answerCompleteness).toBe("partial");
  expect(answer.prose).toBeUndefined();
  expect(answer.artifacts).toEqual([]);
  expect(answer.directAnswer).not.toMatch(/\b(?:two|2)\s+suppliers?\b/i);
  expect(answer.gaps.length).toBeGreaterThan(0);
  expectSourceCitation(answer, statement);
}

beforeEach(() => auditedClient.mockReset());

describe("cited supplier concentration keeps its spend basis", () => {
  const broadenedDenominators = [
    "technology spend",
    "tech spend",
    "IT spend",
    "enterprise budget",
  ];
  const answerFields = [
    "direct_answer",
    "key_points",
    "prose",
    "caveats",
  ] as const;

  describe.each(broadenedDenominators)("unsupported %s", (denominator) => {
    function unsafeReply(field: (typeof answerFields)[number]): ModelReply {
      const unsafe = reply();
      const statement =
        `Two suppliers account for over a quarter of ${denominator}.`;
      if (field === "key_points") {
        unsafe.key_points = [`**Concentration:** ${statement}`];
      } else if (field === "prose") {
        unsafe.prose = `**Business implication:** ${statement}`;
      } else if (field === "caveats") {
        unsafe.caveats = [statement];
      } else {
        unsafe.direct_answer = statement;
      }
      return unsafe;
    }

    it.each(answerFields)(
      "allows one repair of %s that restores the exact source denominator",
      async (field) => {
        const create = mockModelReplies(unsafeReply(field), reply());
        const answer = await answerFromSources();

        expect(create).toHaveBeenCalledTimes(2);
        expect(auditedClient).toHaveBeenCalledTimes(2);
        expect(
          auditedClient.mock.calls.every(([args]) => args.tenantId === tenantKey),
        ).toBe(true);
        expect(auditedClient.mock.calls[1][0].prompt).toContain(vendorClaim);
        expect(answer.status).toBe("answered");
        expect(answer.prose).toContain(vendorClaim);
        expect(
          [
            answer.directAnswer,
            answer.prose,
            ...answer.caveats.map((caveat) => caveat.detail),
          ].join(" "),
        ).not.toContain(denominator);
        expect(answer.citations).toHaveLength(1);
        expectSourceCitation(answer);
      },
    );

    it.each(answerFields)(
      "withholds repeated unsafe %s after one repair and retains source citations",
      async (field) => {
        const create = mockModelReplies(unsafeReply(field));
        const answer = await answerFromSources();

        expect(create).toHaveBeenCalledTimes(2);
        expect(auditedClient).toHaveBeenCalledTimes(2);
        expect(answer.citations).toHaveLength(1);
        expect(answer.caveats.map((caveat) => caveat.detail).join(" ")).not.toContain(
          denominator,
        );
        expectWithheld(answer);
      },
    );
  });

  it("accepts the correct vendor-spend claim with generic unnamed suppliers", async () => {
    const create = mockModelReplies(reply());
    const answer = await answerFromSources();

    expect(create).toHaveBeenCalledTimes(1);
    expect(auditedClient).toHaveBeenCalledTimes(1);
    expect(answer.status).toBe("answered");
    expect(answer.quality.confidence).toBe("high");
    expect(answer.prose).toContain(vendorClaim);
    expectSourceCitation(answer);
  });

  it("accepts a technology-spend concentration backed by its own cited source", async () => {
    const create = mockModelReplies(reply(technologyClaim));
    const answer = await answerFromSources([technologyClaim]);

    expect(create).toHaveBeenCalledTimes(1);
    expect(answer.status).toBe("answered");
    expect(answer.quality.confidence).toBe("high");
    expect(answer.prose).toContain(technologyClaim);
    expectSourceCitation(answer, technologyClaim);
  });

  it("accepts separate vendor and technology concentrations when both sources are cited", async () => {
    const valid = {
      ...reply(vendorClaim, ["TD-K1", "TD-K2"]),
      key_points: [
        `**Vendor basis:** ${vendorClaim}`,
        `**Technology basis:** ${technologyClaim}`,
      ],
    };
    const create = mockModelReplies(valid);
    const answer = await answerFromSources([vendorClaim, technologyClaim]);

    expect(create).toHaveBeenCalledTimes(1);
    expect(answer.status).toBe("answered");
    expect(answer.prose).toContain(vendorClaim);
    expect(answer.prose).toContain(technologyClaim);
    expect(answer.citations).toHaveLength(2);
    expectSourceCitation(answer);
    expectSourceCitation(answer, technologyClaim, "TD-K2");
  });

  it("does not use an uncited technology claim to broaden the cited vendor claim", async () => {
    const unsafe = reply(
      "Two suppliers account for over a quarter of technology spend.",
    );
    const create = mockModelReplies(unsafe);
    const answer = await answerFromSources([vendorClaim, technologyClaim]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(answer.citations.map((citation) => citation.id)).toEqual(["TD-K1"]);
    expectWithheld(answer);
  });

  it("can emit the admitted inventory table alongside a safe concentration claim", async () => {
    const safe = {
      ...reply(),
      visual: {
        type: "table" as const,
        dataset_ref: "tech.application_system.by_businessFunction",
      },
    };
    const create = mockModelReplies(safe);
    const answer = await answerFromSources([vendorClaim], tableQuestion);

    expect(create).toHaveBeenCalledTimes(1);
    expect(answer.status).toBe("answered");
    expect(answer.artifacts).toHaveLength(1);
    expect(answer.artifacts[0]).toMatchObject({
      artifact: "table",
      rows: [{ label: "Operations", value: 2 }],
    });
    expectSourceCitation(answer);
  });

  it("withholds an admitted table when the repair still broadens the denominator", async () => {
    const visual = {
      type: "table" as const,
      dataset_ref: "tech.application_system.by_businessFunction",
    };
    const initial = {
      ...reply("Two suppliers account for over a quarter of technology spend."),
      visual,
    };
    const repaired = {
      ...reply("Two suppliers account for over a quarter of enterprise budget."),
      visual,
    };
    const create = mockModelReplies(initial, repaired);
    const answer = await answerFromSources([vendorClaim], tableQuestion);

    expect(create).toHaveBeenCalledTimes(2);
    expect(auditedClient).toHaveBeenCalledTimes(2);
    expectWithheld(answer);
  });
});

describe("concentration evidence supports the asserted share and supplier count", () => {
  const unrelatedSources = [
    {
      reason: "a different technology percentage",
      vendor: "Two suppliers account for 25% of vendor spend.",
      technology: "Two suppliers account for 5% of technology spend.",
      unsafe: "Two suppliers account for 25% of technology spend.",
    },
    {
      reason: "a four-supplier technology percentage",
      vendor: "Two suppliers account for 25% of vendor spend.",
      technology: "Four suppliers account for 25% of technology spend.",
      unsafe: "Two suppliers account for 25% of technology spend.",
    },
    {
      reason: "a two-supplier technology percentage",
      vendor: "Four suppliers account for 25% of vendor spend.",
      technology: "Two suppliers account for 25% of technology spend.",
      unsafe: "Four suppliers account for 25% of technology spend.",
    },
  ];

  describe.each(unrelatedSources)("citing $reason", (source) => {
    it("requires one repair instead of borrowing the unrelated concentration basis", async () => {
      const create = mockModelReplies(
        reply(source.unsafe, ["TD-K1", "TD-K2"]),
        reply(source.vendor),
      );
      const answer = await answerFromSources([source.vendor, source.technology]);

      expect(create).toHaveBeenCalledTimes(2);
      expect(auditedClient).toHaveBeenCalledTimes(2);
      expect(answer.status).toBe("answered");
      expect(answer.prose).toContain(source.vendor);
      expect(answer.prose).not.toContain(source.unsafe);
      expect(answer.citations).toHaveLength(2);
      expectSourceCitation(answer, source.vendor);
      expectSourceCitation(answer, source.technology, "TD-K2");
    });

    it("withholds the same unsupported claim after the bounded repair", async () => {
      const create = mockModelReplies(reply(source.unsafe, ["TD-K1", "TD-K2"]));
      const answer = await answerFromSources([source.vendor, source.technology]);

      expect(create).toHaveBeenCalledTimes(2);
      expect(auditedClient).toHaveBeenCalledTimes(2);
      expect(answer.directAnswer).not.toContain(source.unsafe);
      expect(answer.citations).toHaveLength(2);
      expectWithheld(answer, source.vendor);
      expectSourceCitation(answer, source.technology, "TD-K2");
    });
  });

  const numericVendorClaim = "Two suppliers account for 25% of vendor spend.";
  const unsafeCaveat = "Two suppliers account for 25% of technology spend.";
  const safeUnknown = "Technology spend concentration remains unknown.";

  it("drops an unsafe original caveat after a valid repair while retaining safe uncertainty", async () => {
    const repairedCaveat = "Source ownership remains unverified.";
    const create = mockModelReplies(
      {
        ...reply(numericVendorClaim),
        caveats: [unsafeCaveat, safeUnknown],
      },
      {
        ...reply(numericVendorClaim),
        caveats: [repairedCaveat],
      },
    );
    const answer = await answerFromSources([numericVendorClaim]);
    const caveats = answer.caveats.map((caveat) => caveat.detail);

    expect(create).toHaveBeenCalledTimes(2);
    expect(auditedClient).toHaveBeenCalledTimes(2);
    expect(answer.status).toBe("answered");
    expect(answer.prose).toContain(numericVendorClaim);
    expect(caveats).not.toContain(unsafeCaveat);
    expect(caveats).toEqual(expect.arrayContaining([safeUnknown, repairedCaveat]));
    expectSourceCitation(answer, numericVendorClaim);
  });

  it.each(["unsafe output", "unavailable"])(
    "removes the unsafe caveat but preserves unknowns when the repair is %s",
    async (failure) => {
      const initial = {
        ...reply(numericVendorClaim),
        caveats: [unsafeCaveat, safeUnknown],
      };
      const create = mockModelReplies(initial);
      if (failure === "unavailable") {
        create.mockRejectedValueOnce(new Error("Synthetic repair unavailable"));
      }
      const answer = await answerFromSources([numericVendorClaim]);
      const caveats = answer.caveats.map((caveat) => caveat.detail);

      expect(create).toHaveBeenCalledTimes(2);
      expect(auditedClient).toHaveBeenCalledTimes(2);
      expect(caveats).not.toContain(unsafeCaveat);
      expect(caveats).toContain(safeUnknown);
      expectWithheld(answer, numericVendorClaim);
    },
  );

  it.each([
    "not technology spend",
    "not 25% of technology spend",
    "rather than 25% of technology spend",
  ])("accepts the source denominator qualified by '%s' without a repair", async (qualification) => {
    const statement =
      `Two suppliers account for 25% of vendor spend, ${qualification}.`;
    const create = mockModelReplies({
      ...reply(statement),
      caveats: [statement],
    });
    const answer = await answerFromSources([numericVendorClaim]);

    expect(create).toHaveBeenCalledTimes(1);
    expect(auditedClient).toHaveBeenCalledTimes(1);
    expect(answer.status).toBe("answered");
    expect(answer.quality.confidence).toBe("high");
    expect(answer.prose).toContain(statement);
    expect(answer.caveats.map((caveat) => caveat.detail)).toContain(statement);
    expectSourceCitation(answer, numericVendorClaim);
  });
});

describe("named concentration participants and current spend qualifiers", () => {
  const namedVendorClaim =
    "Two suppliers Alpha and Beta together account for 25% of vendor spend.";
  const unrelatedTechnologyClaim =
    "Two suppliers Gamma and Delta together account for 25% of technology spend.";

  it("withholds a named vendor pair borrowing another cited pair's technology share while accepting separately cited generic evidence", async () => {
    const unsafe =
      "Two suppliers Alpha and Beta together account for 25% of technology spend.";
    const create = mockModelReplies(reply(unsafe, ["TD-K1", "TD-K2"]));
    const answer = await answerFromSources([
      namedVendorClaim,
      unrelatedTechnologyClaim,
    ]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(auditedClient).toHaveBeenCalledTimes(2);
    expect(answer.citations).toHaveLength(2);
    expectWithheld(answer, namedVendorClaim);
    expectSourceCitation(answer, unrelatedTechnologyClaim, "TD-K2");

    auditedClient.mockReset();
    const genericTechnologyClaim =
      "Two suppliers account for 25% of technology spend.";
    const genericCreate = mockModelReplies(
      reply(genericTechnologyClaim, ["TD-K1", "TD-K2"]),
    );
    const genericAnswer = await answerFromSources([
      namedVendorClaim,
      genericTechnologyClaim,
    ]);

    expect(genericCreate).toHaveBeenCalledTimes(1);
    expect(auditedClient).toHaveBeenCalledTimes(1);
    expect(genericAnswer.status).toBe("answered");
    expect(genericAnswer.prose).toContain(genericTechnologyClaim);
    expectSourceCitation(genericAnswer, genericTechnologyClaim, "TD-K2");
  });

  it("withholds the matched vendor names when the broadened claim omits the suppliers noun", async () => {
    const unsafe =
      "Alpha and Beta together account for 25% of technology spend.";
    const create = mockModelReplies(reply(unsafe, ["TD-K1", "TD-K2"]));
    const answer = await answerFromSources([
      namedVendorClaim,
      unrelatedTechnologyClaim,
    ]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(auditedClient).toHaveBeenCalledTimes(2);
    expect(answer.directAnswer).not.toContain(unsafe);
    expect(answer.citations).toHaveLength(2);
    expectWithheld(answer, namedVendorClaim);
    expectSourceCitation(answer, unrelatedTechnologyClaim, "TD-K2");
  });

  it("does not let the current qualifier disguise an unsupported technology-spend denominator", async () => {
    const source = "Two suppliers account for 25% of vendor spend.";
    const unsafe =
      "Two suppliers account for 25% of current technology spend.";
    const create = mockModelReplies(reply(unsafe));
    const answer = await answerFromSources([source]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(auditedClient).toHaveBeenCalledTimes(2);
    expect(answer.citations).toHaveLength(1);
    expectWithheld(answer, source);
  });
});

describe("explicit bounded bullet requests", () => {
  it("emits exactly three for 'Give three short, evidence-backed bullets' even when four are returned", async () => {
    const initial = {
      ...reply(vendorClaim, ["TD-K1", "TD-K2", "TD-K3", "TD-K4"]),
      key_points: supportingPoints,
    };
    const create = mockModelReplies(initial, {
      ...initial,
      key_points: supportingPoints.slice(0, 3),
    });
    const answer = await answerFromSources(
      supportingClaims,
      "Give three short, evidence-backed bullets",
    );

    expect(answer.status).toBe("answered");
    expect(answer.prose?.match(/^\s*[-*]\s+/gm)).toHaveLength(3);
    expect(answer.prose).toContain(vendorClaim);
    expect(answer.prose).not.toContain(supportingClaims[3]);
    expect(create.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(create.mock.calls.length).toBeLessThanOrEqual(2);
    expectSourceCitation(answer);
  });

  it.each([
    { count: 1, request: "Give one short, evidence-backed bullet" },
    { count: 1, request: "Give 1 short, evidence-backed bullet" },
    { count: 2, request: "Give two short, evidence-backed bullets" },
    { count: 2, request: "Give 2 short, evidence-backed bullets" },
    { count: 3, request: "Give 3 short, evidence-backed bullets" },
    { count: 4, request: "Give four short, evidence-backed bullets" },
    { count: 4, request: "Give 4 short, evidence-backed bullets" },
  ])("honors $request", async ({ count, request }) => {
    const initial = {
      ...reply(vendorClaim, ["TD-K1", "TD-K2", "TD-K3", "TD-K4"]),
      key_points: supportingPoints,
    };
    const create = mockModelReplies(initial, {
      ...initial,
      key_points: supportingPoints.slice(0, count),
    });
    const answer = await answerFromSources(supportingClaims, request);

    expect(answer.status).toBe("answered");
    expect(answer.prose?.match(/^\s*[-*]\s+/gm)).toHaveLength(count);
    for (const statement of supportingClaims.slice(0, count)) {
      expect(answer.prose).toContain(statement);
    }
    for (const statement of supportingClaims.slice(count)) {
      expect(answer.prose).not.toContain(statement);
    }
    expect(create.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(create.mock.calls.length).toBeLessThanOrEqual(2);
    expectSourceCitation(answer);
  });
});

it("instructs the model to keep a fictional proposed target unmeasured and discovery distinct from approval", async () => {
  const proposedQuestion =
    "Consider a fictional proposed 5% vendor-cost target. Should we charter discovery? Give three short, evidence-backed bullets.";
  const create = mockModelReplies({
    ...reply(vendorClaim, ["TD-K1", "TD-K2"]),
    status: "partial",
    direct_answer: "Use discovery to test the proposed, unmeasured target.",
    key_points: [
      "**Ambition:** The user-proposed 5% target is unmeasured; feasibility, achieved results, savings and approval remain unverified.",
      `**Fit:** ${vendorClaim}`,
      "**Discovery:** Review contract renewal dates before any final solution or investment decision.",
    ],
    caveats: ["The proposed target is a scenario assumption, not evidence."],
  });
  const answer = await answerFromSources(
    supportingClaims.slice(0, 2),
    proposedQuestion,
  );
  const system = create.mock.calls[0][0].system as string;

  expect(system).toMatch(
    /user[- ]proposed[^.\n]*(?:ambitions|targets)[^.\n]*scenario assumptions/i,
  );
  expect(system).toMatch(/(?:only|explicitly)[^.\n]*proposed and unmeasured/i);
  expect(system).toMatch(/not tenant facts/i);
  expect(system).toMatch(/without[^.\n]*citing[^.\n]*as evidence/i);
  expect(system).toMatch(/without[^.\n]*calculating savings/i);
  expect(system).toMatch(/without[^.\n]*implying approval/i);
  expect(system).toMatch(/not[^.\n]*achieved results/i);
  expect(system).toMatch(
    /charter[^.\n]*discovery[^.\n]*final[^.\n]*(?:investment|solution)[^.\n]*decision/i,
  );
  expect(create.mock.calls[0][0].messages[0].content).toContain(proposedQuestion);
  expect(create).toHaveBeenCalledTimes(1);
  expect(answer.status).toBe("partial");
  expect(answer.prose?.match(/^\s*[-*]\s+/gm)).toHaveLength(3);
  expect(answer.prose).toContain("user-proposed 5% target is unmeasured");
  expect(JSON.stringify(answer.citations)).not.toContain("5%");
  expectSourceCitation(answer);
});
