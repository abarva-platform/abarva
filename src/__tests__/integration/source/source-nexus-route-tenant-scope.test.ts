import type { NextRequest } from "next/server";

type TenantKey = "tenant-alpha" | "tenant-beta";

const EVENT_ID = "event-alpha-001";
const EVENT_UUID = "evt-alpha-uuid";
const EVENT_CODE = "SRC-ALPHA-001";

const getActiveClientRowMock = jest.fn();
const requireRouteTenancyMock = jest.fn();
const requireExportTenancyMock = jest.fn();
const getSourcingEventForResolvedClientMock = jest.fn();
const getSourcingEventMock = jest.fn();
const createSourceNexusApiStubResponseMock = jest.fn();
const callSourceCanvasChatModelMock = jest.fn();
const getContractOptimizationProfileMock = jest.fn();
const buildContractOptimizationBriefMarkdownMock = jest.fn();
const loadContractEvidenceRuntimeSummaryMock = jest.fn();

function activeClient(key: TenantKey) {
  return {
    id: `client-${key}`,
    name: key === "tenant-alpha" ? "Tenant Alpha" : "Tenant Beta",
    industry_code: null,
    key,
  };
}

function tenancy(key: TenantKey) {
  return {
    clientId: `client-${key}`,
    clientKey: key,
    userId: `user-${key}`,
    role: "client_admin",
    email: `${key}@example.test`,
  };
}

function sourceEvent() {
  return {
    id: EVENT_UUID,
    code: EVENT_CODE,
    name: "Alpha sourcing event",
    accountName: "Tenant Alpha",
    currentStageKey: "strategy",
    stage: "strategy",
    status: "active",
    owner: "Sourcing lead",
    problemStatement: "Renewal pressure.",
    synopsis: "Managed-services renewal scope.",
    scorecard: { decisionOwner: "Sourcing lead", criteria: [] },
  };
}

function stubResponse() {
  return {
    ok: true,
    httpStatus: 200,
    requestId: "req-test",
    eventId: EVENT_UUID,
    prompt: "What is the posture?",
    mode: "event",
    generatedAt: "2026-09-19T00:00:00.000Z",
    noModel: true,
    answer: "Deterministic Source answer.",
    answerStatus: "ok",
    contextScope: "event",
    contextQuality: null,
    context: { missingInputs: [], blockers: [], selectedAttachmentIds: [] },
    sourceIntelligence: null,
    sourceAnswer: {
      engineVersion: "source-answer-engine/v1",
      mode: "event",
      title: "Event answer",
      answerText: "Deterministic Source answer.",
      currentStateFindings: [],
      sourcingImplications: [],
      cxoGuidance: [],
      expertLens: [],
      riskTraps: [],
      missingData: [],
      recommendedNextAction: "Review the event.",
      confidence: "medium",
      limits: [],
      evidenceCitations: [],
      responseParts: [],
    },
    agentResponseParts: [],
    sentinelBriefing: null,
    multiAgentBriefing: null,
    nexusSummary: {
      title: "Event answer",
      summary: "Deterministic Source answer.",
      primaryFinding: "Deterministic Source answer.",
      recommendedNextAction: "Review the event.",
      confidence: "medium",
    },
    warnings: [],
    suggestedActions: [],
  };
}

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireRouteTenancyMock(),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("route tenancy error response should not handle this");
  }),
}));

jest.mock("@/app/api/v1/_intel-auth", () => ({
  requireTenancy: () => requireExportTenancyMock(),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ ok: false, error: "unauthorized" }, { status: 401 }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: (...args: unknown[]) => getSourcingEventMock(...args),
  getSourcingEventForResolvedClient: (...args: unknown[]) =>
    getSourcingEventForResolvedClientMock(...args),
  sourceEventRowToDetail: jest.fn(() => null),
}));

jest.mock("@/lib/source/nexus-api", () => ({
  normalizeSourceNexusApiRequestBody: (body: unknown) => body,
  createSourceNexusApiStubResponse: (...args: unknown[]) =>
    createSourceNexusApiStubResponseMock(...args),
}));

jest.mock("@/lib/source/source-canvas-chat", () => ({
  callSourceCanvasChatModel: (...args: unknown[]) =>
    callSourceCanvasChatModelMock(...args),
}));

jest.mock("@/lib/source/sentinel-chat-llm", () => ({
  applySourceSentinelModelAnswer: jest.fn(
    ({ fallbackResponse, answerText }: { fallbackResponse: Record<string, unknown>; answerText: string }) => ({
      ...fallbackResponse,
      answer: answerText,
      summary: answerText,
    }),
  ),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    linkAttachments: jest.fn(async () => undefined),
  })),
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
  loadContractEvidenceRuntimeSummary: (...args: unknown[]) =>
    loadContractEvidenceRuntimeSummaryMock(...args),
}));

jest.mock("@/lib/source/contract-optimization/read", () => ({
  getContractOptimizationProfile: (...args: unknown[]) =>
    getContractOptimizationProfileMock(...args),
}));

jest.mock("@/lib/source/contract-optimization", () => ({
  buildContractOptimizationBriefMarkdown: (...args: unknown[]) =>
    buildContractOptimizationBriefMarkdownMock(...args),
}));

jest.mock("@/lib/source/ava/answer-quality-gate", () => ({
  enforceSourceExistingEventWriteTruth: (text: string) => text,
}));

jest.mock("@/lib/source/ava/module-handoff-runtime", () => ({
  buildSourceAvaModuleHandoffForRuntime: jest.fn(() => null),
}));

jest.mock("@/lib/source/client-final-artifacts", () => ({
  resolveAuthoritativeArtifactSlots: jest.fn(() => []),
}));

jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: jest.fn(async () => new Map()),
}));

const { POST } = jest.requireActual(
  "@/app/api/v1/source/[eventId]/nexus/ask/route",
) as {
  POST: (
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> },
  ) => Promise<Response>;
};

const { GET } = jest.requireActual(
  "@/app/api/v1/source/[eventId]/contract-optimization/brief/route",
) as {
  GET: (
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> },
  ) => Promise<Response>;
};

function canvasRequest(prompt = "What is the posture?"): NextRequest {
  return {
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify({ prompt, mode: "event" }),
  } as unknown as NextRequest;
}

function exportRequest(): NextRequest {
  return {
    nextUrl: new URL(
      `https://app.example.test/api/v1/source/${EVENT_ID}/contract-optimization/brief`,
    ),
  } as unknown as NextRequest;
}

async function postAsk(eventId = EVENT_ID): Promise<Response> {
  return POST(canvasRequest(), {
    params: Promise.resolve({ eventId }),
  });
}

describe("Source Nexus ask route tenant scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireRouteTenancyMock.mockResolvedValue(tenancy("tenant-alpha"));
    requireExportTenancyMock.mockResolvedValue(tenancy("tenant-alpha"));
    getActiveClientRowMock.mockResolvedValue(activeClient("tenant-alpha"));
    getSourcingEventForResolvedClientMock.mockImplementation(
      async (_eventId: string, args: { activeClientKey: TenantKey }) =>
        args.activeClientKey === "tenant-alpha" ? sourceEvent() : null,
    );
    getSourcingEventMock.mockImplementation(
      async (_eventId: string, clientKey?: TenantKey) =>
        clientKey === "tenant-alpha" ? sourceEvent() : null,
    );
    createSourceNexusApiStubResponseMock.mockImplementation(() => stubResponse());
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: "Model-grounded Source answer.",
      evidenceCitations: [],
      warnings: [],
    });
    loadContractEvidenceRuntimeSummaryMock.mockResolvedValue({
      eventId: EVENT_UUID,
      tenantKey: "tenant-alpha",
      manifests: [],
      families: [],
      metrics: [],
      findings: [],
      missingFamilies: [],
      warnings: [],
      userFacingSummary: "",
    });
    getContractOptimizationProfileMock.mockResolvedValue(null);
    buildContractOptimizationBriefMarkdownMock.mockReturnValue(
      "# Contract optimization\n\nAlpha contract posture.",
    );
  });

  it("serves a same-tenant Source ask through the resolved active client key", async () => {
    const response = await postAsk();
    const body = (await response.json()) as { ok: boolean; summary: string };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.summary).toBe("Model-grounded Source answer.");
    expect(getSourcingEventForResolvedClientMock).toHaveBeenCalledWith(
      EVENT_ID,
      expect.objectContaining({
        activeClientKey: "tenant-alpha",
        activeClientName: "Tenant Alpha",
        tenancy: expect.objectContaining({ clientKey: "tenant-alpha" }),
      }),
    );
    expect(createSourceNexusApiStubResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant: expect.objectContaining({
          tenantKey: "tenant-alpha",
          activeClientName: "Tenant Alpha",
        }),
        liveEventDetail: expect.objectContaining({ id: EVENT_UUID }),
      }),
    );
  });

  it("fails closed when the resolved active client does not own the requested event", async () => {
    requireRouteTenancyMock.mockResolvedValue(tenancy("tenant-beta"));
    getActiveClientRowMock.mockResolvedValue(activeClient("tenant-beta"));

    const response = await postAsk();
    const body = (await response.json()) as { error: string; detail: string };

    expect(response.status).toBe(404);
    expect(body.error).toBe("not_found");
    expect(body.detail).toBe("No Source event found for the active client.");
    expect(getSourcingEventForResolvedClientMock).toHaveBeenCalledWith(
      EVENT_ID,
      expect.objectContaining({
        activeClientKey: "tenant-beta",
        tenancy: expect.objectContaining({ clientKey: "tenant-beta" }),
      }),
    );
    expect(getSourcingEventMock).toHaveBeenCalledWith(EVENT_ID, "tenant-beta");
    expect(createSourceNexusApiStubResponseMock).not.toHaveBeenCalled();
    expect(callSourceCanvasChatModelMock).not.toHaveBeenCalled();
  });

  it("passes the resolved active client key to the aVa model context", async () => {
    await postAsk();

    expect(callSourceCanvasChatModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "tenant-alpha",
        tenantId: "client-tenant-alpha",
        userId: "user-tenant-alpha",
        liveTenantContext: expect.objectContaining({
          clientKey: "tenant-alpha",
          brokerTenantKey: "tenant-alpha",
        }),
      }),
    );
    expect(loadContractEvidenceRuntimeSummaryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "tenant-alpha",
        sourceEventId: EVENT_UUID,
      }),
    );
  });

  it("uses the resolved active client key for contract-optimization exports", async () => {
    getContractOptimizationProfileMock.mockResolvedValue({
      tenantKey: "tenant-alpha",
      contractName: "Alpha contract",
    });

    const response = await GET(exportRequest(), {
      params: Promise.resolve({ eventId: EVENT_ID }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-source-event-code")).toBe(EVENT_CODE);
    expect(await response.text()).toContain("Alpha contract posture.");
    expect(getSourcingEventMock).toHaveBeenCalledWith(
      EVENT_ID,
      "tenant-alpha",
    );
    expect(getContractOptimizationProfileMock).toHaveBeenCalledWith(
      "tenant-alpha",
      EVENT_UUID,
    );
  });
});
