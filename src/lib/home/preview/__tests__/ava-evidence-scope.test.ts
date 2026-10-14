import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

import { answerHomeAvaQuestion } from "../ava-answer";
import type { ChapterView } from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

jest.mock("../source-support", () => ({
  verifyHomeAnswerSupport: jest.fn().mockResolvedValue({
    supported: true, reason: "supported", unsupportedFields: [],
  }),
}));

const auditedClient = jest.mocked(getAuditedAnthropicClient);
const tenantKey = CANONICAL_TENANT_KEYS[0];
const question = "Should we charter discovery? Give one short bullet.";
const source = "Only 24% of promised AI portfolio value is finance-validated.";
const safePoint =
  "**Baseline:** Successful self-service resolution is not established in this Home record; discovery must establish eligibility, repeat-contact exclusions and Agent Assist measures separately.";

function chapter(statement = source): ChapterView {
  return {
    chapterId: "performance_value",
    title: "Reference context",
    guidingQuestion: "What can this record establish?",
    headline: "Establish the evidence before acting.",
    executive_synthesis: statement,
    key_insights: [
      {
        statement,
        confidence: "high",
        evidence_ids: ["reference-scope"],
        claim_type: "FACT",
      },
    ],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: [],
  };
}

function reply() {
  return {
    status: "partial",
    direct_answer:
      "Discovery should establish the service baseline before assessing a proposed, unmeasured target.",
    key_points: [safePoint],
    prose: "",
    cited_claim_tags: ["PV-K1"],
    visual: { type: "none", dataset_ref: null, chart_kind: null },
    caveats: [
      "This is a proposed target, not a measured result or savings commitment.",
    ],
  };
}

function mockReplies(initial: ReturnType<typeof reply>, repaired = reply()) {
  const message = (value: ReturnType<typeof reply>) => ({
    content: [{ type: "text", text: JSON.stringify(value) }],
  });
  const create = jest
    .fn()
    .mockResolvedValueOnce(message(initial))
    .mockResolvedValue(message(repaired));
  auditedClient.mockResolvedValue({
    client: { messages: { create } },
    auditId: "reference-scope-audit",
    dataClass: "confidential",
  } as never);
  return create;
}

function answer(statement = source) {
  return answerHomeAvaQuestion({
    bundle: { chapters: [chapter(statement)] },
    tenantKey,
    question,
  });
}

beforeEach(() => auditedClient.mockReset());

it.each([
  "No member service transformation program, baseline or Agent Assist evidence exists yet.",
  "No service transformation program or resolution-rate baseline exists in current tracking.",
  "The service transformation program does not exist.",
  "Service transformation programs are absent from current tracking.",
  "No baseline evidence is available yet.",
])(
  "repairs enterprise absence inferred from a bounded record: %s",
  async (unsafe) => {
    const create = mockReplies({ ...reply(), direct_answer: unsafe });
    const packet = await answer();
    expect(create).toHaveBeenCalledTimes(2);
    expect(packet.directAnswer).not.toContain(unsafe);
    expect(packet.prose).toContain("in this Home record");
    expect(packet.citations).toEqual([
      expect.objectContaining({ id: "PV-K1", excerpt: source }),
    ]);
    expect(validateAvaAnswerPacket(packet).passed).toBe(true);
  },
);

it.each(["direct_answer", "prose", "key_points", "caveats"] as const)(
  "does not let portfolio validation become enterprise-wide in %s",
  async (field) => {
    const unsafe =
      "Only 24% of promised AI value is finance-validated enterprise-wide.";
    const initial = {
      ...reply(),
      [field]:
        field === "key_points" || field === "caveats" ? [unsafe] : unsafe,
    };
    const create = mockReplies(initial);
    const packet = await answer();
    expect(create).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(packet)).not.toContain(unsafe);
    expect(packet.citations[0].excerpt).toBe(source);
  },
);

it.each([
  "No resolution-rate baseline exists in this Home record.",
  "No program evidence is available in the supplied context.",
  "Program evidence is absent from the current record.",
])(
  "preserves an explicit record-scoped gap without repair: %s",
  async (qualified) => {
    const create = mockReplies({ ...reply(), direct_answer: qualified });
    const packet = await answer();
    expect(create).toHaveBeenCalledTimes(1);
    expect(packet.directAnswer).toBe(qualified);
  },
);

it("accepts an explicitly cited enterprise-wide validation basis", async () => {
  const statement =
    "Only 24% of promised AI value is finance-validated enterprise-wide.";
  const create = mockReplies({ ...reply(), key_points: [statement] });
  const packet = await answer(statement);
  expect(create).toHaveBeenCalledTimes(1);
  expect(packet.prose).toContain(statement);
});

it.each([
  "Enterprise-wide value governance needs review.",
  "Only 24% of promised program value is finance-validated enterprise-wide.",
  "AI portfolio validation does not establish enterprise-wide benefit validation.",
])(
  "an unrelated or negative citation cannot bless broadened portfolio validation: %s",
  async (additionalSource) => {
    const unsafe = {
      ...reply(),
      key_points: [
        "Only 24% of promised AI value is finance-validated enterprise-wide.",
      ],
      cited_claim_tags: ["PV-K1", "PV-K2"],
    };
    const create = mockReplies(unsafe, unsafe);
    const base = chapter();
    const packet = await answerHomeAvaQuestion({
      bundle: {
        chapters: [
          {
            ...base,
            key_insights: [
              ...base.key_insights,
              {
                statement: additionalSource,
                confidence: "high",
                evidence_ids: ["reference-other-scope"],
                claim_type: "FACT",
              },
            ],
          },
        ],
      },
      tenantKey,
      question,
    });
    expect(create).toHaveBeenCalledTimes(2);
    expect(packet.prose).toBeUndefined();
    expect(packet.quality.confidence).toBe("low");
  },
);

it("preserves the explicit portfolio-only qualification without repair", async () => {
  const caveat =
    "AI-portfolio benefit validation is not enterprise-wide benefit validation.";
  const create = mockReplies({ ...reply(), caveats: [caveat] });
  const packet = await answer();
  expect(create).toHaveBeenCalledTimes(1);
  expect(packet.caveats[0].detail).toBe(caveat);
});

it("admits the same validation percentage and AI population when enterprise scope is explicitly cited", async () => {
  const enterpriseSource =
    "Only 24% of promised AI value is finance-validated enterprise-wide.";
  const create = mockReplies({
    ...reply(),
    key_points: [enterpriseSource],
    cited_claim_tags: ["PV-K1", "PV-K2"],
  });
  const base = chapter();
  const packet = await answerHomeAvaQuestion({
    bundle: {
      chapters: [
        {
          ...base,
          key_insights: [
            ...base.key_insights,
            {
              statement: enterpriseSource,
              confidence: "high",
              evidence_ids: ["reference-enterprise-scope"],
              claim_type: "FACT",
            },
          ],
        },
      ],
    },
    tenantKey,
    question,
  });
  expect(create).toHaveBeenCalledTimes(1);
  expect(packet.prose).toContain(enterpriseSource);
});

it("does not treat a Home attribution as scope for an enterprise-wide absence", async () => {
  const unsafe = {
    ...reply(),
    direct_answer:
      "No transformation program exists anywhere in the enterprise, according to this Home record.",
  };
  const create = mockReplies(unsafe, unsafe);
  const packet = await answer();
  expect(create).toHaveBeenCalledTimes(2);
  expect(packet.prose).toBeUndefined();
  expect(packet.directAnswer).not.toBe(unsafe.direct_answer);
});

it("repairs vendor allocation described as loss of internal control", async () => {
  const unsafe =
    "**Spend:** Over half of the technology budget flows to third-party vendors and sits outside internal control.";
  const create = mockReplies({ ...reply(), key_points: [unsafe] });
  const packet = await answer(
    "Over half of the technology budget is allocated to vendor contracts.",
  );
  expect(create).toHaveBeenCalledTimes(2);
  expect(packet.prose).not.toContain("outside internal control");
});

it("preserves a denial of the unsupported vendor-control inference", async () => {
  const qualified =
    "Vendor contract spend is not outside internal control simply because it is allocated to third parties.";
  const create = mockReplies({ ...reply(), key_points: [qualified] });
  const packet = await answer(
    "Over half of the technology budget is allocated to vendor contracts.",
  );
  expect(create).toHaveBeenCalledTimes(1);
  expect(packet.prose).toContain(qualified);
});

it.each([true, false])(
  "withholds an unsafe second answer even with citations=%s",
  async (cited) => {
    const unsafe = {
      ...reply(),
      direct_answer: "No service transformation program exists.",
      cited_claim_tags: cited ? ["PV-K1"] : [],
    };
    const create = mockReplies(unsafe, unsafe);
    const packet = await answer();
    expect(create).toHaveBeenCalledTimes(2);
    expect(packet.status).toBe("partial");
    expect(packet.directAnswer).not.toContain(unsafe.direct_answer);
    expect(packet.prose).toBeUndefined();
    expect(packet.artifacts).toEqual([]);
    expect(packet.quality.confidence).toBe("low");
  },
);

it("places the bounded-record and portfolio rules in primary and repair prompts", async () => {
  const create = mockReplies({
    ...reply(),
    direct_answer: "No service transformation program exists.",
  });
  await answer();
  expect(create.mock.calls[0][0].system).toContain(
    "Missing evidence here never proves something does not exist elsewhere",
  );
  expect(create.mock.calls[1][0].messages[0].content).toContain(
    "AI-portfolio validation is not enterprise-wide validation",
  );
});

it.each([
  "No causal inference is established from contract pricing.",
  "SLA evidence is unavailable for selected contracts in this Home record.",
  "Document-level evidence is absent for some contracts in this Home record.",
  "Supplier approval is absent; vendor spend alone does not establish it.",
])(
  "preserves a supported supplier pair alongside a legitimate limitation: %s",
  async (caveat) => {
    const pair =
      "Example Alpha and Example Beta together represent over a quarter of vendor spend.";
    const create = mockReplies({
      ...reply(),
      direct_answer: pair,
      caveats: [caveat],
    });
    const packet = await answerHomeAvaQuestion({
      bundle: {
        chapters: [chapter(pair)],
        technologyEstate: {
          recordTypes: [
            {
              objectType: "vendor_contract",
              label: "Vendor Contracts",
              primaryDimension: null,
              columns: ["vendorName", "annualSpendUsd", "pricingHistory"],
              rows: [
                {
                  vendorName: "Example Alpha",
                  annualSpendUsd: 70,
                  pricingHistory: "Current pricing supplied.",
                },
                { vendorName: "Example Beta", annualSpendUsd: 30 },
              ],
              dimensionCounts: [],
            },
          ],
        },
      },
      tenantKey,
      question,
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(packet.directAnswer).toBe(pair);
    expect(packet.citations[0].excerpt).toBe(pair);
    expect(packet.caveats[0].detail).toBe(caveat);
    expect(JSON.stringify(packet)).not.toContain("older supplier-pair");
  },
);

it("corrects contradicted blanket evidence absence without claiming a concentration conflict", async () => {
  mockReplies({
    ...reply(),
    caveats: [
      "Contract evidence is absent for all declared vendor contracts in this Home record.",
    ],
  });
  const packet = await answerHomeAvaQuestion({
    bundle: {
      chapters: [chapter()],
      technologyEstate: {
        recordTypes: [
          {
            objectType: "vendor_contract",
            label: "Vendor Contracts",
            primaryDimension: null,
            columns: ["pricingHistory"],
            rows: [{ pricingHistory: "Current pricing supplied." }],
            dimensionCounts: [],
          },
        ],
      },
    },
    tenantKey,
    question,
  });
  expect(packet.caveats[0].detail).toContain(
    "Some contract evidence is present in this record",
  );
  expect(packet.caveats[0].detail).not.toContain("supplier-pair");
});

it("does not retain a contradicted generic record caveat after safe repair", async () => {
  const unsafe = {
    ...reply(),
    direct_answer: "No service transformation program exists.",
    caveats: ["No contract evidence is available in this record."],
  };
  const create = mockReplies(unsafe);
  const packet = await answerHomeAvaQuestion({
    bundle: {
      chapters: [chapter()],
      technologyEstate: {
        recordTypes: [
          {
            objectType: "vendor_contract",
            label: "Vendor Contracts",
            columns: ["pricingHistory"],
            primaryDimension: null,
            rows: [{ pricingHistory: "Current pricing supplied." }],
            dimensionCounts: [],
          },
        ],
      },
    },
    tenantKey,
    question,
  });
  expect(create).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(packet)).not.toContain(
    "No contract evidence is available",
  );
  expect(
    packet.caveats.some((caveat) =>
      caveat.detail.includes("Some contract evidence is present"),
    ),
  ).toBe(true);
});
