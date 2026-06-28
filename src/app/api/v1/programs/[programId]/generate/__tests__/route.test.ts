const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGenerateArtifact = jest.fn();
const mockCreateDeliverableRun = jest.fn();
const mockAssertPhaseReady = jest.fn();
const mockPersist = jest.fn();

jest.mock("../../../_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, id: string) => mockGetProgramById(ctx, id),
}));

jest.mock("@/lib/deliverables/generate-artifact", () => ({
  generateArtifact: (...args: unknown[]) => mockGenerateArtifact(...args),
}));

jest.mock("@/lib/deliverables/moves-generate-deps", () => ({
  createMovesGenerateArtifactDeps: jest.fn(() => ({
    gateSources: { captureComplete: jest.fn(), gateApproved: jest.fn() },
    contextSources: {},
    callModel: jest.fn(),
  })),
  normalizeMovesDeliverableKey: jest.fn((input: string | undefined, phase: number) => {
    if (input === "discovery_report" || phase === 2) return "discovery_report";
    return "charter";
  }),
}));

jest.mock("@/lib/deliverables/profiles/registry", () => ({
  getDeliverableProfile: jest.fn((key: string) => ({
    title: key === "discovery_report" ? "Current Work Diagnostic" : "Program Charter",
    decisionPurpose: key === "discovery_report" ? "Diagnose current work." : "Frame the move.",
  })),
}));

jest.mock("@/lib/deliverables/orchestrator/runs-repository", () => ({
  createDeliverableRun: (...args: unknown[]) => mockCreateDeliverableRun(...args),
}));

jest.mock("@/lib/programs/assert-phase-ready", () => ({
  assertPhaseReadyForGeneration: (...args: unknown[]) => mockAssertPhaseReady(...args),
}));

jest.mock("@/lib/deliverables/persist-move-generated-artifact", () => ({
  persistMoveGeneratedArtifact: (...args: unknown[]) => mockPersist(...args),
}));

function req(body: unknown): Request {
  return new Request("http://test/api/v1/programs/move-1/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ programId: "move-1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    clientId: "client-1",
    clientKey: "lakeshore-holdings",
    userId: "user-1",
    email: "cio@example.com",
  });
  mockGetProgramById.mockResolvedValue({
    id: "move-1",
    name: "Lakeshore Back-office Automation",
    archetype: "ai_opportunity_discovery",
    currentPhase: 2,
    problemStatement: "Improve AP exception handling.",
    targetOutcome: "Reduce duplicate invoices and cycle time.",
    archivedAt: null,
    deletedAt: null,
  });
  mockAssertPhaseReady.mockResolvedValue({
    ready: true,
    blockers: [],
    draftCaveats: [{ reason: "Phase 2 gate is not approved." }],
  });
  mockCreateDeliverableRun.mockResolvedValue({ id: "run-p2-1" });
  mockGenerateArtifact.mockResolvedValue({
    status: "generated",
    html: "<html><body><svg></svg><table></table>Charter</body></html>",
    context: {},
    goldenBar: { pass: true, hasDataGap: false },
    generationMode: "final",
    draftOnly: false,
    draftCaveats: [],
    contextCaveats: [],
  });
  mockPersist.mockResolvedValue({
    deliverableId: "deliv-1",
    versionId: "ver-1",
    artifactId: "artifact-1",
    artifactVersion: 1,
    artifactBlobStored: true,
  });
});

export {};

describe("POST /api/v1/programs/[programId]/generate", () => {
  it("queues P2 Current Work Diagnostic drafts instead of running Claude in the web request", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 2,
        deliverableTypeKey: "discovery_report",
        title: "Current Work Diagnostic",
        generationMode: "draft",
      }),
      routeParams,
    );

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      runId: "run-p2-1",
      status: "queued",
      async: true,
      phase: 2,
      deliverableKey: "discovery_report",
      generationMode: "draft",
    });
    expect(mockAssertPhaseReady).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        phase: 2,
        generationMode: "draft",
      }),
      expect.anything(),
    );
    expect(mockCreateDeliverableRun).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        tenantKey: "lakeshore-holdings",
        module: "moves",
        deliverableType: "discovery_report",
        jobPayload: expect.objectContaining({
          kind: "moves_premium_artifact",
          sourceArtifactRef: "move-1",
          phase: 2,
          artifact: "discovery_report",
          generationMode: "draft",
        }),
      }),
    );
    expect(mockGenerateArtifact).not.toHaveBeenCalled();
  });

  it("keeps final gate blocking before enqueue", async () => {
    mockAssertPhaseReady.mockResolvedValueOnce({
      ready: false,
      blockers: [{ reason: "Phase capture incomplete.", code: "capture_incomplete" }],
    });
    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 2,
        deliverableTypeKey: "discovery_report",
        title: "Current Work Diagnostic",
        generationMode: "draft",
      }),
      routeParams,
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "generation_gate_blocked",
      phase: 2,
      deliverableKey: "discovery_report",
    });
    expect(mockCreateDeliverableRun).not.toHaveBeenCalled();
    expect(mockGenerateArtifact).not.toHaveBeenCalled();
  });

  it("leaves non-P2 artifacts on the existing generated-and-persisted path", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 1,
        deliverableTypeKey: "charter",
        title: "Program Charter",
        generationMode: "final",
      }),
      routeParams,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      deliverableId: "deliv-1",
      artifactId: "artifact-1",
      deliverableKey: "charter",
      outputFormat: "html",
    });
    expect(mockCreateDeliverableRun).not.toHaveBeenCalled();
    expect(mockGenerateArtifact).toHaveBeenCalled();
    expect(mockPersist).toHaveBeenCalled();
  });
});
