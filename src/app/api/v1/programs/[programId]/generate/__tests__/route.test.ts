const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGenerateArtifact = jest.fn();
const mockCreateDeliverableRun = jest.fn();
const mockAssertPhaseReady = jest.fn();
const mockPersist = jest.fn();
const mockLoadEvidenceSnapshot = jest.fn();
const mockIsFeatureEnabled = jest.fn(() => false);
const mockLoadValueGeneration = jest.fn();

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (...args: unknown[]) => mockIsFeatureEnabled(...(args as [])),
}));
jest.mock("@/lib/programs/value-model-generation", () => ({
  loadValueGenerationForMove: (...args: unknown[]) => mockLoadValueGeneration(...args),
}));

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
    if (input === "target_state_architecture" || phase === 3) return "target_state_architecture";
    return "charter";
  }),
}));

jest.mock("@/lib/deliverables/profiles/registry", () => ({
  getDeliverableProfile: jest.fn((key: string) => ({
    title:
      key === "discovery_report"
        ? "Current Work Diagnostic"
        : key === "target_state_architecture"
          ? "P3 Future-State Blueprint Draft"
          : "Program Charter",
    decisionPurpose:
      key === "discovery_report"
        ? "Diagnose current work."
        : key === "target_state_architecture"
          ? "Shape the future state."
          : "Frame the move.",
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

jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  ...jest.requireActual("@/lib/programs/approved-move-evidence-snapshot"),
  loadApprovedMoveEvidenceSnapshot: (...args: unknown[]) =>
    mockLoadEvidenceSnapshot(...args),
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
  mockLoadEvidenceSnapshot.mockResolvedValue({
    revision: "approved-revision-1",
    approvedEvidenceCount: 1,
    rows: [],
    revisionByPhase: {
      1: "approved-revision-1",
      2: "approved-revision-1",
      3: "approved-revision-1",
      4: "approved-revision-1",
      5: "approved-revision-1",
    },
    latestEvidenceActivityAt: null,
    latestEvidenceActivityAtByPhase: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
    },
  });
  mockIsFeatureEnabled.mockReturnValue(false);
  mockLoadValueGeneration.mockResolvedValue({ kind: "legacy" });
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
          evidenceSnapshotHash: "approved-revision-1",
        }),
      }),
    );
    expect(mockGenerateArtifact).not.toHaveBeenCalled();
  });

  it("queues P3 Future-State Blueprint drafts through the private operator lane", async () => {
    mockCreateDeliverableRun.mockResolvedValueOnce({ id: "run-p3-1" });
    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 3,
        deliverableTypeKey: "target_state_architecture",
        title: "P3 Future-State Blueprint Draft",
        generationMode: "draft",
      }),
      routeParams,
    );

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      runId: "run-p3-1",
      status: "queued",
      async: true,
      phase: 3,
      deliverableKey: "target_state_architecture",
      generationMode: "draft",
    });
    expect(mockAssertPhaseReady).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "move-1",
        phase: 3,
        generationMode: "draft",
      }),
      expect.anything(),
    );
    expect(mockCreateDeliverableRun).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        tenantKey: "lakeshore-holdings",
        module: "moves",
        deliverableType: "target_state_architecture",
        jobPayload: expect.objectContaining({
          kind: "moves_premium_artifact",
          sourceArtifactRef: "move-1",
          phase: 3,
          artifact: "target_state_architecture",
          generationMode: "draft",
          title: "P3 Future-State Blueprint Draft",
          evidenceSnapshotHash: "approved-revision-1",
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
    expect(mockPersist).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceSnapshotHash: "approved-revision-1",
      }),
    );
  });

  it("keeps the P4 legacy path when the value flag is off or capture is free text", async () => {
    const { POST } = await import("../route");
    const off = await POST(req({ phase: 4, deliverableTypeKey: "business_case" }), routeParams);
    expect(off.status).toBe(200);
    expect(mockLoadValueGeneration).not.toHaveBeenCalled();
    mockIsFeatureEnabled.mockReturnValue(true);
    const freeText = await POST(req({ phase: 4, deliverableTypeKey: "business_case" }), routeParams);
    expect(freeText.status).toBe(200);
    expect(mockLoadValueGeneration).toHaveBeenCalledWith(expect.anything(), "move-1");
  });

  it("refuses a blocked structured P4 case with review detail before legacy generation", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockLoadValueGeneration.mockResolvedValue({ kind: "review_required", detail: "Blocked lever L1; resolve [A:V3]." });
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 4, deliverableTypeKey: "business_case" }), routeParams);
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "value_model_review_required", detail: "Blocked lever L1; resolve [A:V3]." });
    expect(mockGenerateArtifact).not.toHaveBeenCalled();
  });

  it("refuses a ready structured P4 case on the ungoverned HTML route", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockLoadValueGeneration.mockResolvedValue({ kind: "ready", snapshot: { prompt: "engine" } });
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 4, deliverableTypeKey: "business_case" }), routeParams);
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual(expect.objectContaining({ error: "value_engine_phase_build_required" }));
    expect(mockGenerateArtifact).not.toHaveBeenCalled();
  });
});
