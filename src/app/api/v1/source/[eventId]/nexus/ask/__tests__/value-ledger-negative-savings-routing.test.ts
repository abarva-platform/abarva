import type { NextRequest } from "next/server";

const buildEvidenceReadinessGovernedAnswerMock = jest.fn();
const buildValueLedgerGovernedAnswerMock = jest.fn();
const callSourceCanvasChatModelMock = jest.fn();

function deterministicStubResponse() {
  return {
    ok: true,
    httpStatus: 200,
    requestId: "req-test",
    eventId: "evt-test",
    prompt: "",
    mode: "event",
    generatedAt: "2026-09-22T00:00:00.000Z",
    noModel: true,
    answer: "Deterministic Source event briefing.",
    answerStatus: "ok",
    contextScope: "event",
    contextQuality: null,
    context: {
      missingInputs: ["Approved scope", "Evidence availability review"],
      blockers: [],
      selectedAttachmentIds: [],
      stageLabel: "define",
    },
    sourceIntelligence: null,
    sourceAnswer: null,
    agentResponseParts: [],
    sentinelBriefing: null,
    multiAgentBriefing: null,
    nexusSummary: {
      title: "Event answer",
      summary: "Deterministic Source event briefing.",
      primaryFinding: "Deterministic Source event briefing.",
      recommendedNextAction: "Open scope and strategy",
      confidence: "medium",
    },
    warnings: [],
    suggestedActions: [],
  };
}

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    clientId: "client-1",
    clientKey: "example-tenant",
    userId: "user-1",
  })),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error path should not be reached in this suite");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    name: "Example Tenant",
    industry_code: null,
    key: "example-tenant",
  })),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: jest.fn(async () => null),
  getSourcingEventForResolvedClient: jest.fn(async () => ({
    id: "evt-test",
    code: "SRC-TEST-001",
    name: "Define stage event",
    accountName: "Example Tenant",
    currentStageKey: "strategy",
    currentStageLabel: "Define",
    stage: "strategy",
    status: "active",
    owner: "Sourcing lead",
    blocker: "Approved scope and evidence availability review are missing.",
    problemStatement: "The event is still in Define.",
    synopsis: "Scope and evidence readiness must be completed before advancement.",
    scorecard: { decisionOwner: "Sourcing lead", criteria: [] },
  })),
  sourceEventRowToDetail: jest.fn(() => null),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => {
  const emptyResult = { data: [], error: null };
  const builder: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "is",
    "not",
    "or",
    "filter",
    "neq",
    "gte",
    "lte",
  ]) {
    builder[method] = () => builder;
  }
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(emptyResult).then(resolve);
  builder.maybeSingle = async () => ({ data: null, error: null });
  builder.single = async () => ({ data: null, error: null });
  return {
    getAzureReadFluentClient: jest.fn(() => ({ from: () => builder })),
  };
});

jest.mock("@/lib/source/contract-evidence/read-model", () => ({
  loadContractEvidenceRuntimeSummary: jest.fn(async () => ({
    eventId: "evt-test",
    tenantKey: "example-tenant",
    manifests: [],
    families: [],
    metrics: [],
    findings: [],
    missingFamilies: [],
    warnings: [],
    userFacingSummary: "",
  })),
}));

jest.mock("@/lib/source/adapters/apex-retail-adapter", () => ({
  APEX_RETAIL_BROKER_TENANT_KEY: "apex-retail-broker",
  APEX_RETAIL_CLIENT_KEY: "apex-retail",
  buildApexRetailSourceContextAssemblyInput: jest.fn(async () => null),
  toApexRetailLiveTenantContextSnapshot: jest.fn(() => null),
}));

jest.mock("@/lib/source/nexus-api", () => {
  const actual = jest.requireActual("@/lib/source/nexus-api");
  return {
    ...actual,
    createSourceNexusApiStubResponse: jest.fn(() => deterministicStubResponse()),
  };
});

jest.mock("@/lib/source/source-canvas-chat", () => ({
  SOURCE_CANVAS_CHAT_MODEL: "claude-sonnet-4-6",
  callSourceCanvasChatModel: (...args: unknown[]) =>
    callSourceCanvasChatModelMock(...args),
}));

jest.mock("@/lib/source/ava/evidence-readiness-governed-answer", () => {
  const actual = jest.requireActual(
    "@/lib/source/ava/evidence-readiness-governed-answer",
  );
  return {
    ...actual,
    buildEvidenceReadinessGovernedAnswer: (...args: unknown[]) =>
      buildEvidenceReadinessGovernedAnswerMock(...args),
  };
});

jest.mock("@/lib/source/ava/value-ledger-governed-answer", () => {
  const actual = jest.requireActual(
    "@/lib/source/ava/value-ledger-governed-answer",
  );
  return {
    ...actual,
    buildValueLedgerGovernedAnswer: (...args: unknown[]) =>
      buildValueLedgerGovernedAnswerMock(...args),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("@/app/api/v1/source/[eventId]/nexus/ask/route") as {
  POST: (
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> },
  ) => Promise<Response>;
};

function canvasRequest(prompt: string): NextRequest {
  return {
    headers: new Headers({
      "content-type": "application/json",
      accept: "application/x-ndjson",
    }),
    text: async () =>
      JSON.stringify({
        prompt,
        mode: "event",
      }),
  } as unknown as NextRequest;
}

async function askCanvasNdjson(
  prompt: string,
): Promise<Array<Record<string, unknown>>> {
  const response = await POST(canvasRequest(prompt), {
    params: Promise.resolve({ eventId: "evt-test" }),
  });
  expect(response.status).toBe(200);
  return (await response.text())
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("Source nexus/ask value-ledger routing", () => {
  beforeEach(() => {
    buildEvidenceReadinessGovernedAnswerMock.mockReset();
    buildValueLedgerGovernedAnswerMock.mockReset();
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: "The event response is available for review.",
      evidenceCitations: [],
      warnings: [],
    });
    buildEvidenceReadinessGovernedAnswerMock.mockResolvedValue({
      directAnswer:
        "Define is blocked by missing scope approval and evidence review. The sourcing lead should open scope and strategy next.",
      intent: "source_stage_completion",
      citations: [],
      artifacts: [],
    });
    buildValueLedgerGovernedAnswerMock.mockResolvedValue({
      directAnswer:
        "No event-scoped Source value ledger rows are available for this event.",
      intent: "value_ledger_waterfall",
      status: "no_data",
      citations: [],
      artifacts: [],
    });
  });

  it("routes the signed-in Define blocker prompt to stage readiness despite a negative savings instruction", async () => {
    const prompt =
      "What is blocking this event from advancing from Define, and what exact action should the sourcing lead take next? Do not estimate savings or recommend a supplier.";

    const lines = await askCanvasNdjson(prompt);

    expect(buildEvidenceReadinessGovernedAnswerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-test",
        clientKey: "example-tenant",
        question: prompt,
        stageContext: expect.objectContaining({
          stageKey: "strategy",
          stageLabel: "Define",
          nextAction: "Open scope and strategy",
          blocker:
            "Approved scope and evidence availability review are missing.",
          missingInputs: [
            "Approved scope",
            "Evidence availability review",
          ],
        }),
      }),
    );
    expect(buildValueLedgerGovernedAnswerMock).not.toHaveBeenCalled();
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "summary",
          answer:
            "Define is blocked by missing scope approval and evidence review. The sourcing lead should open scope and strategy next.",
          summary:
            "Define is blocked by missing scope approval and evidence review. The sourcing lead should open scope and strategy next.",
          sourceAnswer: null,
          agentResponseParts: [],
        }),
      ]),
    );
  });

  it("continues routing genuine value-ledger questions to the governed value answer", async () => {
    const prompt = "Show the value waterfall for this event.";

    await askCanvasNdjson(prompt);

    expect(buildValueLedgerGovernedAnswerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-test",
        clientKey: "example-tenant",
        tenantId: "client-1",
        question: prompt,
      }),
    );
    expect(buildEvidenceReadinessGovernedAnswerMock).not.toHaveBeenCalled();
  });
});
