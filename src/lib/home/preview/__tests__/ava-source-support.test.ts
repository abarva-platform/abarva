import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import { answerHomeAvaQuestion } from "../ava-answer";
import { verifyHomeAnswerSupport } from "../source-support";
import type { ChapterView } from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));
jest.mock("../source-support", () => ({ verifyHomeAnswerSupport: jest.fn() }));

const source =
  "Revenue is split 60% provider delivery and 40% health plan. The health plan is jointly 70% Medicare Advantage and Medicare FFS; this mix could make performance an outsized factor in plan-side economics.";
const chapter: ChapterView = {
  chapterId: "our_business",
  title: "Business",
  guidingQuestion: "How does it make money?",
  headline: "Understand the business mix.",
  executive_synthesis: source,
  key_insights: [
    {
      statement: source,
      evidence_ids: ["business-reference"],
      confidence: "high",
      claim_type: "FACT",
    },
  ],
  tensions: [],
  what_to_watch: [],
  questions_to_ask: [],
  visual_opportunities: [],
  limitations: [],
};
const safe = {
  status: "partial",
  direct_answer:
    "The published record describes an integrated provider and health plan.",
  key_points: [
    "**Business mix:** Revenue is split 60% provider delivery and 40% health plan.",
  ],
  prose: "",
  cited_claim_tags: ["OB-K1"],
  visual: { type: "none", dataset_ref: null, chart_kind: null },
  caveats: [] as string[],
};
const support = jest.mocked(verifyHomeAnswerSupport);
const audited = jest.mocked(getAuditedAnthropicClient);
function generate(initial = safe, repaired = safe) {
  const message = (response: typeof safe) => ({
    content: [{ type: "text", text: JSON.stringify(response) }],
  });
  const create = jest
    .fn()
    .mockResolvedValueOnce(message(initial))
    .mockResolvedValue(message(repaired));
  audited.mockResolvedValue({
    client: { messages: { create } },
    auditId: "source-check",
    dataClass: "confidential",
  } as never);
  return create;
}
function answer() {
  return answerHomeAvaQuestion({
    bundle: { chapters: [chapter], declaredSyntheticDemo: true },
    tenantKey: CANONICAL_TENANT_KEYS[0],
    question: "What do we know about the business? Give one short bullet.",
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  support.mockReset();
});

it("verifies the meaning of every displayed assertion using only selected published claims", async () => {
  generate();
  support.mockResolvedValue({
    supported: true,
    reason: "supported",
    unsupportedFields: [],
  });
  const packet = await answer();
  expect(support).toHaveBeenCalledWith(
    expect.objectContaining({
      syntheticReference: true,
      claims: [{ tag: "OB-K1", statement: source, claimType: "FACT" }],
      fields: [
        { id: "direct_answer", text: safe.direct_answer },
        { id: "key_point_1", text: safe.key_points[0] },
      ],
      timeoutMs: expect.any(Number),
    }),
  );
  expect(packet.directAnswer).toBe(safe.direct_answer);
  expect(validateAvaAnswerPacket(packet).passed).toBe(true);
});

it("repairs a semantic overstatement that is not caught by fixed phrase guards", async () => {
  const unsafe = {
    ...safe,
    direct_answer:
      "Medicare Advantage disproportionately drives financial results and strategy.",
  };
  const create = generate(unsafe);
  support
    .mockResolvedValueOnce({
      supported: false,
      reason: "unsupported",
      unsupportedFields: ["direct_answer"],
    })
    .mockResolvedValue({
      supported: true,
      reason: "supported",
      unsupportedFields: [],
    });
  const packet = await answer();
  expect(create).toHaveBeenCalledTimes(2);
  expect(audited.mock.calls[1][0].prompt).toContain(
    "meaning is not fully supported",
  );
  expect(audited.mock.calls[1][0].prompt).toContain(unsafe.direct_answer);
  expect(packet.directAnswer).toBe(safe.direct_answer);
});

it("publishes exact, complete source context at low confidence when the interpretation stays unsupported", async () => {
  const unsafe = {
    ...safe,
    direct_answer:
      "Medicare Advantage disproportionately drives financial results and strategy.",
  };
  generate(unsafe, unsafe);
  support.mockResolvedValue({
    supported: false,
    reason: "unsupported",
    unsupportedFields: ["direct_answer"],
  });
  const packet = await answer();
  expect(packet.status).toBe("partial");
  expect(packet.quality.confidence).toBe("low");
  expect(packet.directAnswer).not.toContain("disproportionately");
  expect(packet.prose).toContain(source);
  expect(packet.prose).toContain("could make");
  expect(packet.citations[0].excerpt).toBe(source);
  expect(packet.artifacts).toEqual([]);
  expect(validateAvaAnswerPacket(packet).passed).toBe(true);
});

it("fails closed to published context rather than admitting prose when verification is unavailable", async () => {
  const create = generate();
  support.mockResolvedValue({
    supported: false,
    reason: "unavailable",
    unsupportedFields: [],
  });
  const packet = await answer();
  expect(create).toHaveBeenCalledTimes(1);
  expect(packet.quality.confidence).toBe("low");
  expect(packet.prose).toContain(source);
  expect(packet.caveats.map((item) => item.detail).join(" ")).toContain(
    "not verified",
  );
});

it("does not admit unknown citations from a rejected draft into an accepted repair", async () => {
  generate({ ...safe, cited_claim_tags: ["OB-K1", "UNKNOWN"] });
  support
    .mockResolvedValueOnce({
      supported: false,
      reason: "unsupported",
      unsupportedFields: ["direct_answer"],
    })
    .mockResolvedValue({
      supported: true,
      reason: "supported",
      unsupportedFields: [],
    });
  const packet = await answer();
  expect(packet.citations.map((c) => c.id)).toEqual(["OB-K1"]);
});

it.each(["unsupported", "unavailable"] as const)(
  "explicitly labels indirect leadership attribution as synthetic in %s recovery",
  async (reason) => {
    const statement = "The COO believes reporting needs attention.";
    const response = {
      ...safe,
      direct_answer: "Review the available context before acting.",
      key_points: [
        "**Review:** Inspect the published context before making a decision.",
      ],
    };
    generate(response, response);
    support.mockResolvedValue({
      supported: false,
      reason,
      unsupportedFields: ["direct_answer"],
    });
    const packet = await answerHomeAvaQuestion({
      bundle: {
        chapters: [
          {
            ...chapter,
            key_insights: [{ ...chapter.key_insights[0], statement }],
          },
        ],
        declaredSyntheticDemo: true,
      },
      tenantKey: CANONICAL_TENANT_KEYS[0],
      question: "What should leadership review? Give one short bullet.",
    });
    expect(packet.prose).toContain(
      "**Published synthetic reference, not client testimony:**",
    );
    expect(packet.prose).toContain(statement);
    expect(packet.prose).not.toContain("**Published fact:**");
    expect(packet.quality.confidence).toBe("low");
  },
);

it("does not retain generated caveats on the failed formatting path that skips semantic verification", async () => {
  const unsafe = {
    ...safe,
    key_points: [
      "**Context:** " +
        Array.from(
          { length: 52 },
          (_, index) =>
            "scope" +
            String.fromCharCode(97 + Math.floor(index / 26), 97 + (index % 26)),
        ).join(" "),
    ],
    caveats: ["The acquisition was approved by the board."],
  };
  generate(unsafe, unsafe);
  const packet = await answer();
  expect(support).not.toHaveBeenCalled();
  expect(JSON.stringify(packet)).not.toContain(
    "The acquisition was approved by the board",
  );
  expect(packet.status).toBe("partial");
});

it("does not pass generated no-data caveats into cited claim recovery", async () => {
  generate({
    ...safe,
    status: "no_data",
    cited_claim_tags: [],
    caveats: ["The acquisition was approved by the board."],
  });
  const packet = await answerHomeAvaQuestion({
    bundle: { chapters: [chapter] },
    tenantKey: CANONICAL_TENANT_KEYS[0],
    question: "What should the CFO review?",
  });
  expect(support).not.toHaveBeenCalled();
  expect(JSON.stringify(packet)).not.toContain(
    "The acquisition was approved by the board",
  );
  expect(packet.citations).not.toHaveLength(0);
});
