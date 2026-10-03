// INCIDENT 2026-07-20 regression coverage. This route previously called
// preparePhaseGateApprovalRecords, which fabricated-and-signed-off a
// placeholder deliverables_v2 row for stale hardcoded type keys BEFORE
// evaluateGate ran, so a hard gate check could genuinely "pass" against
// evidence nobody ever produced. The fix deleted that function entirely.
// These tests prove: (1) a hard gate failure blocks approval and no
// deliverable-mutation helper exists to fabricate a pass around it, (2) a
// genuine gate pass still advances the phase, (3) capture-incomplete and
// already-approved short-circuits still work, (4) the P0 path still
// delegates to closeP0OnApproval untouched.

const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockGetPhaseSnapshots = jest.fn();
const mockLoadApprovedMoveEvidenceSnapshot = jest.fn();
const mockLoadP0MinimumEvidenceStatus = jest.fn();
const mockEvaluateGate = jest.fn();
const mockAdvancePhase = jest.fn();
const mockCloseP0OnApproval = jest.fn();
const mockWriteProgramAuditLogBestEffort = jest.fn();
const mockSaveGateDecisionArtifact = jest.fn();
const mockGetPhaseCaptureSections = jest.fn();
const mockListApprovedPhaseEvidence = jest.fn();
const mockResolveConfirmedSolutionRoute = jest.fn();
const mockPersistP0PhaseCaptureFromSource = jest.fn();
const mockSbFrom = jest.fn();
const mockLoadDiscoveryEvidenceReadiness = jest.fn();
const mockBuildMoveEvidenceNeedPackets = jest.fn();
const mockLoadAcceptedStageReadinessContext = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadUserProgramAccessPolicy(ctx, opts),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: mockSbFrom }),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
  getModuleState: (ctx: unknown, programId: string) =>
    mockGetModuleState(ctx, programId),
  getPhaseSnapshots: (ctx: unknown, programId: string, phase: number) =>
    mockGetPhaseSnapshots(ctx, programId, phase),
}));

jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  loadApprovedMoveEvidenceSnapshot: async (...args: unknown[]) => {
    const snapshot = await mockLoadApprovedMoveEvidenceSnapshot(...args);
    if (!snapshot) return null;
    const phases = [1, 2, 3, 4, 5];
    return {
      ...snapshot,
      revisionByPhase:
        snapshot.revisionByPhase ??
        Object.fromEntries(phases.map((phase) => [phase, snapshot.revision])),
      latestEvidenceActivityAtByPhase:
        snapshot.latestEvidenceActivityAtByPhase ??
        Object.fromEntries(
          phases.map((phase) => [
            phase,
            snapshot.latestEvidenceActivityAt ?? null,
          ]),
        ),
    };
  },
}));

jest.mock("@/lib/programs/p0-source-evidence", () => ({
  loadP0MinimumEvidenceStatus: (...args: unknown[]) =>
    mockLoadP0MinimumEvidenceStatus(...args),
}));

jest.mock("@/lib/programs/discovery/evidence-readiness", () => ({
  loadDiscoveryEvidenceReadiness: (...args: unknown[]) =>
    mockLoadDiscoveryEvidenceReadiness(...args),
}));

jest.mock("@/lib/programs/evidence-readiness/move-evidence-need-packet", () => ({
  buildMoveEvidenceNeedPackets: (...args: unknown[]) =>
    mockBuildMoveEvidenceNeedPackets(...args),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/accepted-context", () => ({
  loadAcceptedStageReadinessContext: (...args: unknown[]) =>
    mockLoadAcceptedStageReadinessContext(...args),
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: (
    ctx: unknown,
    programId: string,
    fromPhase: number,
    toPhase: number,
    opts: unknown,
  ) => mockEvaluateGate(ctx, programId, fromPhase, toPhase, opts),
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase: (ctx: unknown, input: unknown, opts: unknown) =>
    mockAdvancePhase(ctx, input, opts),
}));

jest.mock("@/lib/programs/origination-close", () => ({
  closeP0OnApproval: (input: unknown) => mockCloseP0OnApproval(input),
}));

jest.mock("@/lib/programs/audit-log", () => ({
  writeProgramAuditLogBestEffort: (ctx: unknown, input: unknown) =>
    mockWriteProgramAuditLogBestEffort(ctx, input),
}));

jest.mock("@/lib/programs/deliverables/gate-override-artifact", () => ({
  saveGateDecisionArtifact: (ctx: unknown, input: unknown) =>
    mockSaveGateDecisionArtifact(ctx, input),
}));

jest.mock("@/lib/programs/approved-phase-evidence", () => ({
  listApprovedPhaseEvidence: (ctx: unknown, programId: string, phase: number) =>
    mockListApprovedPhaseEvidence(ctx, programId, phase),
}));

jest.mock("@/lib/programs/solution-route-assessment", () => ({
  resolveConfirmedSolutionRoute: (args: unknown) =>
    mockResolveConfirmedSolutionRoute(args),
}));

jest.mock("@/lib/programs/phase-capture-contract", () => ({
  getPhaseCaptureSections: (phase: number, confirmedSolutionRoute?: unknown) =>
    mockGetPhaseCaptureSections(phase, confirmedSolutionRoute),
  phaseCaptureModuleKey: (phase: number, sectionKey: string) =>
    `phase_${phase}_${sectionKey}`,
}));

jest.mock("@/lib/programs/p0-phase-capture", () => ({
  persistP0PhaseCaptureFromSource: (
    ctx: unknown,
    programId: string,
    input: unknown,
  ) => mockPersistP0PhaseCaptureFromSource(ctx, programId, input),
}));

jest.mock("@/lib/programs/move-progress-notifications", () => ({
  sendMoveProgressUpdate: jest.fn().mockResolvedValue(undefined),
}));

function req(body: unknown): Request {
  return new Request("http://test/api/v1/programs/prog-1/phase-gate-approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getReq(phase: number) {
  return {
    nextUrl: { searchParams: new URLSearchParams({ phase: String(phase) }) },
  };
}

const params = Promise.resolve({ programId: "prog-1" });
const ctx = {
  clientId: "client-1",
  clientKey: "lakeshore",
  userId: "person-1",
  role: "client_admin",
  email: "reviewer@example.com",
};

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(ctx);
  mockLoadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: true });
  mockGetProgramById.mockResolvedValue({
    id: "prog-1",
    name: "MEMBER AI ASSIST",
    currentPhase: 3,
    gatesPassed: [],
  });
  mockListApprovedPhaseEvidence.mockResolvedValue([]);
  mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({});
  mockBuildMoveEvidenceNeedPackets.mockImplementation(
    (input: { moveId: string; currentPhase: number }) => [
      {
        moveId: input.moveId,
        phase: input.currentPhase,
        artifactType: "discovery_report",
        evidenceSlot: "Contact center KPI baseline",
        familyId: "contact_center_kpis",
        priority: "required",
        ownerSource: "Operations and Finance",
        acceptedFormats: ["CSV"],
        exampleTemplate: "KPI baseline",
        exampleContent: [],
        whyItMatters: "Evidence-backed baseline",
        blockedArtifacts: [
          {
            artifactType: "discovery_report",
            title: "Discovery Report",
            phase: input.currentPhase + 1,
            reason: "Required evidence",
          },
        ],
        canDraftBoundary: {
          canDraft: true,
          canDraftLabel: "Can draft",
          cannotDraftLabel: "Cannot draft",
        },
        preliminaryGenerationCaveat: null,
        waiverOption: null,
        nextAction: "Review the approved KPI file.",
        status: "covered",
        evidenceIds: ["ev-kpi"],
        evidenceTitles: ["contact-center-kpis.csv"],
      },
    ],
  );
  mockLoadAcceptedStageReadinessContext.mockResolvedValue({
    moveId: "prog-1",
    sourcePhase: 3,
    targetPhase: 4,
    reviewArtifactId: "review-1",
    reviewArtifactVersion: 1,
    proposals: [
      {
        proposalId: "proposal-kpi",
        questionId: "q_kpi_baseline",
        dimensionId: "contact_center_kpis",
        requirement: "required",
        answerState: "answered",
        disposition: "accepted",
        evidenceOrSource: "Existing evidence: ev-kpi",
      },
    ],
    acceptedResponses: [],
    readiness: { ready: 1, partial: 0, insufficientEvidence: 0, unknown: 0 },
  });
  mockResolveConfirmedSolutionRoute.mockReturnValue(null);
  // Capture is complete by default so tests can focus on the gate check.
  mockGetPhaseCaptureSections.mockReturnValue([
    { key: "review", label: "Review" },
  ]);
  mockGetModuleState.mockResolvedValue([
    { moduleKey: "phase_3_review", status: "completed" },
  ]);
  mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
    revision: "evidence-revision-1",
    latestEvidenceActivityAt: "2026-09-29T16:00:00.000Z",
    approvedEvidenceCount: 1,
    rows: [],
  });
  mockLoadP0MinimumEvidenceStatus.mockResolvedValue({
    available: true,
    approvedSourceFileCount: 1,
    pendingReviewCount: 0,
    evidenceTitles: ["p0-intake.md"],
  });
  mockGetPhaseSnapshots.mockImplementation(
    async (_ctx: unknown, _programId: string, phase: number) =>
      phase === 2 || phase === 4
        ? [
            {
              id: `phase-${phase}-approved`,
              phaseNumber: phase,
              approvalStatus: "approved",
              lockedAt: "2026-09-29T17:00:00.000Z",
              createdAt: "2026-09-29T17:00:00.000Z",
              snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
            },
          ]
        : [],
  );
  mockEvaluateGate.mockResolvedValue({
    failedChecks: [],
    requiresApproval: false,
  });
  mockAdvancePhase.mockResolvedValue({
    programId: "prog-1",
    newPhase: 4,
    snapshotId: "snap-1",
  });
  mockSaveGateDecisionArtifact.mockResolvedValue(null);
  mockWriteProgramAuditLogBestEffort.mockResolvedValue(undefined);
  mockSbFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        eq: () => ({
          limit: async () => ({ data: [{ id: "participant-1" }], error: null }),
        }),
      }),
    }),
  });
});

describe("POST /api/v1/programs/[programId]/phase-gate-approval", () => {
  it("does not advance when the transition workbook has no accepted, evidence-backed review", async () => {
    mockLoadAcceptedStageReadinessContext.mockResolvedValueOnce(null);
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "transition_evidence_incomplete",
      requiredEvidenceGaps: [
        expect.objectContaining({
          evidenceSlot: "Contact center KPI baseline",
          status: "partial",
        }),
      ],
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("blocks approval on a hard gate failure and fabricates nothing", async () => {
    mockEvaluateGate.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) => ({
        failedChecks:
          phase === 3
            ? [
                {
                  check: "design_approved",
                  reason: "No approved P3 architecture deliverable exists",
                  severity: "hard",
                },
              ]
            : [],
        requiresApproval: false,
      }),
    );

    const { POST } = await import("../route");
    const res = await POST(
      req({ phase: 3, rationale: "Reviewed and approved." }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "gate_blocked" });
    expect(mockEvaluateGate).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      3,
      4,
      expect.objectContaining({ allowHistoricalPhase: false }),
    );
    // No fabrication helper exists in this route anymore; the only writes
    // possible on a hard fail are none — advancePhase must never be called.
    expect(mockAdvancePhase).not.toHaveBeenCalled();
    expect(mockSaveGateDecisionArtifact).not.toHaveBeenCalled();
  });

  it("advances the phase on a genuine gate pass with no deliverable fabrication", async () => {
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 3,
        rationale: "Architecture reviewed and approved.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, newPhase: 4 });
    expect(mockAdvancePhase).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        programId: "prog-1",
        fromPhase: 3,
        toPhase: 4,
        snapshot: expect.objectContaining({
          evidenceSnapshotHash: "evidence-revision-1",
        }),
      }),
      expect.anything(),
    );
    expect(mockSaveGateDecisionArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        softGapsCarried: false,
        hardGateOverride: null,
        carriedGaps: [],
      }),
    );
  });

  it("lets the authorized user approve P1 without becoming the sponsor", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      name: "Synthetic Move",
      currentPhase: 1,
      gatesPassed: [],
    });
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_review", status: "completed" },
    ]);
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: true,
    });
    mockSbFrom.mockClear();

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 1 }) as never, { params });

    expect(res.status).toBe(200);
    expect(mockLoadUserProgramAccessPolicy).toHaveBeenCalledWith(ctx, {
      programId: "prog-1",
    });
    expect(mockSbFrom).not.toHaveBeenCalled();
    expect(mockAdvancePhase).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ approvedByUserId: ctx.userId }),
      expect.anything(),
    );
  });

  it("shows a prior approval as stale after approved evidence changes", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 2,
      gatesPassed: [1],
    });
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: "evidence-revision-2",
      latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
      approvedEvidenceCount: 2,
      rows: [],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 1
          ? [
              {
                id: "p1-old-approval",
                phaseNumber: 1,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );

    const { GET } = await import("../route");
    const res = await GET(getReq(1) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      approved: false,
      approvalStale: true,
      evidenceSnapshotAvailable: true,
      currentPhase: 2,
    });
  });

  it("shows a hash-matching approval as stale when later approved activity exists", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 2,
      gatesPassed: [1],
    });
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: "evidence-revision-1",
      latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
      approvedEvidenceCount: 2,
      rows: [],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 1
          ? [
              {
                id: "p1-hash-matching-approval",
                phaseNumber: 1,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );

    const { GET } = await import("../route");
    const res = await GET(getReq(1) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      approved: false,
      approvalStale: true,
      evidenceSnapshotAvailable: true,
      currentPhase: 2,
    });
  });

  it("does not present an approved historical snapshot as valid when its hard gate is now blocked", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 2,
      gatesPassed: [1],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 1
          ? [
              {
                id: "p1-approved",
                phaseNumber: 1,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "charter_signed_off",
          reason: "The approved artifact is not bound to current evidence.",
          severity: "hard",
        },
      ],
      requiresApproval: false,
    });

    const { GET } = await import("../route");
    const res = await GET(getReq(1) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      approved: false,
      approvalStale: true,
      canApprove: false,
      gate: {
        failedChecks: [
          expect.objectContaining({
            check: "charter_signed_off",
            severity: "hard",
          }),
        ],
      },
    });
  });

  it("blocks historical reapproval until the deliverable gate is current", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 2,
      gatesPassed: [1],
    });
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_review", status: "completed" },
    ]);
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 1
          ? [
              {
                id: "p1-approved",
                phaseNumber: 1,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "charter_signed_off",
          reason: "The approved artifact is not bound to current evidence.",
          severity: "hard",
        },
      ],
      requiresApproval: false,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({ phase: 1, rationale: "Re-review historical phase." }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "gate_blocked" });
    expect(mockEvaluateGate).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      1,
      2,
      expect.objectContaining({ allowHistoricalPhase: true }),
    );
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("reapproves a stale earlier phase against current evidence without rolling phase back", async () => {
    const writes: Array<{ table: string; payload: Record<string, unknown> }> =
      [];
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 2,
      gatesPassed: [1],
    });
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: "evidence-revision-2",
      latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
      approvedEvidenceCount: 2,
      rows: [],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 1
          ? [
              {
                id: "p1-old-approval",
                phaseNumber: 1,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );
    mockSbFrom.mockImplementation((table: string) => {
      if (table === "phase_snapshots") {
        return {
          insert: jest.fn((payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return {
              select: jest.fn(() => ({
                single: async () => ({
                  data: { id: "p1-reapproval" },
                  error: null,
                }),
              })),
            };
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: async () => ({ data: [{ id: "reviewer" }], error: null }),
            }),
          }),
        }),
      };
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 1,
        rationale: "Re-reviewed against the current evidence set.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      newPhase: 2,
      reapproved: true,
      reapprovedPhase: 1,
      snapshotId: "p1-reapproval",
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
    expect(mockEvaluateGate).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      1,
      2,
      expect.objectContaining({ allowHistoricalPhase: true }),
    );
    expect(
      JSON.parse(writes[0].payload.snapshot_jsonb as string),
    ).toMatchObject({
      evidenceSnapshotHash: "evidence-revision-2",
      humanRationale: "Re-reviewed against the current evidence set.",
    });
  });

  it("blocks a later phase while its immediately preceding gate is stale", async () => {
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: "evidence-revision-2",
      latestEvidenceActivityAt: "2026-09-29T18:00:00.000Z",
      approvedEvidenceCount: 2,
      rows: [],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 2
          ? [
              {
                id: "p2-old-approval",
                phaseNumber: 2,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "prior_gate_stale",
      stalePhase: 2,
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("fails closed when the approved evidence revision cannot be loaded", async () => {
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue(null);

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      error: "evidence_snapshot_unavailable",
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("completes terminal P5 from signed deliverable gates and records gate 5 even when duplicate capture text is absent", async () => {
    const writes: Array<{ table: string; payload: Record<string, unknown> }> =
      [];
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      name: "MEMBER AI ASSIST",
      currentPhase: 5,
      gatesPassed: [],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 4
          ? [
              {
                id: "phase-4-approved",
                phaseNumber: 4,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : [],
    );
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "launch_readiness", label: "Launch readiness" },
    ]);
    mockGetModuleState.mockResolvedValue([]);
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: true,
    });
    mockSbFrom.mockImplementation((table: string) => {
      if (table === "phase_snapshots") {
        return {
          insert: jest.fn((payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return {
              select: jest.fn(() => ({
                single: async () => ({
                  data: { id: "p5-snap-1" },
                  error: null,
                }),
              })),
            };
          }),
        };
      }
      if (table === "engagements") {
        return {
          update: jest.fn((payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return {
              eq: jest.fn(() => ({
                eq: async () => ({ error: null }),
              })),
            };
          }),
        };
      }
      if (table === "module_state_log") {
        return {
          insert: jest.fn(async (payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return { error: null };
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ limit: async () => ({ data: [], error: null }) }),
          }),
        }),
      };
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({ phase: 5, rationale: "Terminal handoff approved." }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      newPhase: 6,
      terminalHandoff: true,
      snapshotId: "p5-snap-1",
      carriedGaps: ["phase_capture_incomplete"],
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
    expect(writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "phase_snapshots",
          payload: expect.objectContaining({
            phase_number: 5,
            approval_status: "approved",
            snapshot_jsonb: expect.any(String),
          }),
        }),
        expect.objectContaining({
          table: "engagements",
          payload: expect.objectContaining({
            lifecycle_state: "completed",
            gates_passed: expect.any(String),
          }),
        }),
        expect.objectContaining({
          table: "module_state_log",
          payload: expect.objectContaining({
            module_key: "phase_5",
            new_state: "completed",
            context_jsonb: expect.any(String),
          }),
        }),
      ]),
    );
    const snapshotWrite = writes.find(
      (write) => write.table === "phase_snapshots",
    );
    const engagementWrite = writes.find(
      (write) => write.table === "engagements",
    );
    const logWrite = writes.find((write) => write.table === "module_state_log");
    expect(
      JSON.parse(snapshotWrite?.payload.snapshot_jsonb as string),
    ).toMatchObject({
      terminal_tower_handoff: true,
    });
    expect(JSON.parse(engagementWrite?.payload.gates_passed as string)).toEqual(
      [5],
    );
    expect(JSON.parse(logWrite?.payload.context_jsonb as string)).toMatchObject(
      {
        terminal_tower_handoff: true,
        snapshot_id: "p5-snap-1",
      },
    );
  });

  it("repairs a partial P5 approval snapshot instead of short-circuiting terminal handoff completion", async () => {
    const writes: Array<{ table: string; payload: Record<string, unknown> }> =
      [];
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      name: "MEMBER AI ASSIST",
      currentPhase: 5,
      lifecycleState: "active",
      gatesPassed: [],
    });
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 4
          ? [
              {
                id: "phase-4-approved",
                phaseNumber: 4,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : phase === 5
            ? [
                {
                  id: "partial-snapshot",
                  phaseNumber: 5,
                  approvalStatus: "approved",
                  lockedAt: "2026-09-29T17:00:00.000Z",
                  createdAt: "2026-09-29T17:00:00.000Z",
                  snapshot: {
                    evidenceSnapshotHash: "evidence-revision-1",
                    phaseEvidenceSnapshotHash: "evidence-revision-1",
                  },
                },
              ]
            : [],
    );
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "launch_readiness", label: "Launch readiness" },
    ]);
    mockGetModuleState.mockResolvedValue([]);
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: true,
    });
    mockSbFrom.mockImplementation((table: string) => {
      if (table === "phase_snapshots") {
        return {
          insert: jest.fn((payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return {
              select: jest.fn(() => ({
                single: async () => ({
                  data: { id: "repair-snapshot" },
                  error: null,
                }),
              })),
            };
          }),
        };
      }
      if (table === "engagements") {
        return {
          update: jest.fn((payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return {
              eq: jest.fn(() => ({
                eq: async () => ({ error: null }),
              })),
            };
          }),
        };
      }
      if (table === "module_state_log") {
        return {
          insert: jest.fn(async (payload: Record<string, unknown>) => {
            writes.push({ table, payload });
            return { error: null };
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ limit: async () => ({ data: [], error: null }) }),
          }),
        }),
      };
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 5,
        rationale: "Complete partial terminal handoff.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      newPhase: 6,
      terminalHandoff: true,
      snapshotId: "repair-snapshot",
    });
    expect(body.alreadyApproved).toBeUndefined();
    expect(mockEvaluateGate).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      5,
      6,
      expect.anything(),
    );
    expect(writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "phase_snapshots" }),
        expect.objectContaining({
          table: "engagements",
          payload: expect.objectContaining({ lifecycle_state: "completed" }),
        }),
        expect.objectContaining({ table: "module_state_log" }),
      ]),
    );
  });

  it("labels a soft-carry pass as softGapsCarried=true, never as an override", async () => {
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "optional_stakeholder_review",
          reason: "Not logged",
          severity: "soft",
        },
      ],
      requiresApproval: false,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({ phase: 3, rationale: "Approved with a soft gap noted." }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockAdvancePhase).toHaveBeenCalled();
    expect(mockSaveGateDecisionArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        softGapsCarried: true,
        hardGateOverride: null,
        carriedGaps: [
          expect.objectContaining({
            check: "optional_stakeholder_review",
            severity: "soft",
          }),
        ],
      }),
    );
  });

  it("blocks P0 approval when phase capture is incomplete", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 0,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "brief", label: "Brief" },
    ]);
    mockGetModuleState.mockResolvedValue([]);

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 0 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "capture_incomplete",
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("blocks P0 approval until one uploaded source file has approved review", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 0,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "brief", label: "Brief" },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_0_brief", status: "completed" },
    ]);
    mockLoadP0MinimumEvidenceStatus.mockResolvedValue({
      available: true,
      approvedSourceFileCount: 0,
      pendingReviewCount: 1,
      evidenceTitles: [],
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 0 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "p0_evidence_required",
      requiredSourceFiles: 1,
      approvedSourceFiles: 0,
      pendingReviewCount: 1,
    });
    expect(mockCloseP0OnApproval).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("reports P0 as not approvable while the only file is awaiting review", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 0,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "brief", label: "Brief" },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_0_brief", status: "completed" },
    ]);
    mockLoadP0MinimumEvidenceStatus.mockResolvedValue({
      available: true,
      approvedSourceFileCount: 0,
      pendingReviewCount: 1,
      evidenceTitles: [],
    });

    const { GET } = await import("../route");
    const res = await GET(getReq(0) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      canApprove: false,
      p0Evidence: {
        available: true,
        approvedSourceFileCount: 0,
        pendingReviewCount: 1,
      },
    });
  });

  it("carries P1-P5 capture gaps as audit context when the hard gate passes", async () => {
    mockGetModuleState.mockResolvedValue([]);
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      carriedGaps: ["phase_capture_incomplete"],
    });
    expect(mockEvaluateGate).toHaveBeenCalled();
    expect(mockAdvancePhase).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        programId: "prog-1",
        fromPhase: 3,
        toPhase: 4,
      }),
      expect.anything(),
    );
    expect(mockSaveGateDecisionArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        softGapsCarried: true,
        carriedGaps: [
          expect.objectContaining({
            check: "phase_capture_incomplete",
            severity: "soft",
          }),
        ],
      }),
    );
  });

  it("checks P3 capture against the sections of the confirmed solution route, not the default list", async () => {
    // A limited process change is asked for a smaller, different set of P3
    // inputs. The gate used to check the default list, so it reported
    // sections the Move was never asked for as missing and could never
    // report capture complete.
    const limitedRoute = {
      route: "process_change",
      workflowChange: "limited",
      roleAccountabilityChange: "none",
    };
    mockGetPhaseCaptureSections.mockImplementation(
      (_phase: number, route?: unknown) =>
        route
          ? [{ key: "workflow_delta", label: "Workflow change delta" }]
          : [
              {
                key: "operating_model",
                label: "Operating model & work split",
              },
            ],
    );
    mockGetModuleState.mockResolvedValue([
      {
        moduleKey: "phase_1_business_change_assessment",
        status: "completed",
        state: { value: "p1-assessment" },
      },
      {
        moduleKey: "phase_2_solution_route_validation",
        status: "completed",
        state: { value: "p2-validation" },
      },
      { moduleKey: "phase_3_workflow_delta", status: "completed" },
    ]);
    mockListApprovedPhaseEvidence.mockResolvedValue([
      { evidenceId: "evidence-p2-1" },
    ]);
    mockResolveConfirmedSolutionRoute.mockReturnValue(limitedRoute);
    mockEvaluateGate.mockResolvedValue({ pass: true, failedChecks: [] });
    const { GET } = await import("../route");

    const res = await GET(getReq(3) as never, { params });
    const json = await res.json();

    expect(mockListApprovedPhaseEvidence).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      2,
    );
    expect(mockResolveConfirmedSolutionRoute).toHaveBeenCalledWith({
      businessChangeAssessment: "p1-assessment",
      routeValidation: "p2-validation",
      approvedEvidenceReferences: ["evidence-p2-1"],
    });
    expect(mockGetPhaseCaptureSections).toHaveBeenCalledWith(3, limitedRoute);
    expect(json.capture).toEqual({ complete: true, missing: [] });
  });

  it("does not resolve a solution route for phases other than P3", async () => {
    mockEvaluateGate.mockResolvedValue({ pass: true, failedChecks: [] });
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_2_review", status: "completed" },
    ]);
    const { GET } = await import("../route");

    await GET(getReq(2) as never, { params });

    expect(mockResolveConfirmedSolutionRoute).not.toHaveBeenCalled();
    expect(mockGetPhaseCaptureSections).toHaveBeenCalledWith(2, null);
  });

  it("short-circuits when the phase is already approved", async () => {
    mockGetPhaseSnapshots.mockImplementation(
      async (_ctx: unknown, _programId: string, phase: number) =>
        phase === 2
          ? [
              {
                id: "phase-2-approved",
                phaseNumber: 2,
                approvalStatus: "approved",
                lockedAt: "2026-09-29T17:00:00.000Z",
                createdAt: "2026-09-29T17:00:00.000Z",
                snapshot: { evidenceSnapshotHash: "evidence-revision-1" },
              },
            ]
          : phase === 3
            ? [
                {
                  id: "phase-3-approved",
                  phaseNumber: 3,
                  approvalStatus: "approved",
                  lockedAt: "2026-09-29T17:00:00.000Z",
                  createdAt: "2026-09-29T17:00:00.000Z",
                  snapshot: {
                    evidenceSnapshotHash: "evidence-revision-1",
                    phaseEvidenceSnapshotHash: "evidence-revision-1",
                  },
                },
              ]
            : [],
    );

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ alreadyApproved: true });
    expect(mockEvaluateGate).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      3,
      4,
      expect.objectContaining({ allowHistoricalPhase: true }),
    );
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("delegates P0 approval to closeP0OnApproval and does not fabricate a P0 deliverable", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      name: "MEMBER AI ASSIST",
      currentPhase: 0,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "brief", label: "Brief" },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_0_brief", status: "completed" },
    ]);
    mockCloseP0OnApproval.mockResolvedValue({
      advanced: true,
      newPhase: 1,
      blockedBy: [],
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({ phase: 0, rationale: "Sponsor approved." }) as never,
      {
        params,
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, newPhase: 1 });
    expect(mockCloseP0OnApproval).toHaveBeenCalled();
    expect(mockEvaluateGate).not.toHaveBeenCalled();
  });

  it("blocks P0 approval when closeP0OnApproval reports it did not advance", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 0,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      { key: "brief", label: "Brief" },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_0_brief", status: "completed" },
    ]);
    mockCloseP0OnApproval.mockResolvedValue({
      advanced: false,
      newPhase: 0,
      blockedBy: ["origination_brief_signed_off"],
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 0 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "gate_blocked" });
  });

  it("rejects approval when the caller lacks gate-approval permission", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: false,
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(403);
    expect(mockEvaluateGate).not.toHaveBeenCalled();
  });
});

export {};
