import {
  MOVE_UNREADABLE_REFUSAL_DETAIL,
  moveUnreadableRefusalBody,
} from "@/lib/programs/move-unreadable-refusal";
import { unexpectedWalkStepDetail } from "@/lib/programs/walk-step-unexpected-failure";
import {
  ORIGINATION_CLOSE_NON_GATE_STOPS,
  ORIGINATION_CLOSE_OUTCOMES,
  originationCloseErrorCode,
  describeOriginationCloseOutcome,
} from "@/lib/programs/origination-close-outcome";

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

jest.mock(
  "@/lib/programs/evidence-readiness/move-evidence-need-packet",
  () => ({
    buildMoveEvidenceNeedPackets: (...args: unknown[]) =>
      mockBuildMoveEvidenceNeedPackets(...args),
  }),
);

jest.mock("@/lib/programs/stage-readiness-workbooks/accepted-context", () => ({
  loadAcceptedStageReadinessContext: (...args: unknown[]) =>
    mockLoadAcceptedStageReadinessContext(...args),
}));

// The gate now reads the stored transition review AS IT STANDS, from its own
// module, rather than only a finished one. By default one stored review stands
// behind both readings, so every existing `mockResolvedValueOnce(null)` still
// means "no review" — and a test can drive the two apart to pin which module
// the gate actually reads.
const mockLoadStageReadinessGateProposals = jest.fn(
  async (...args: unknown[]) => {
    const context = (await mockLoadAcceptedStageReadinessContext(...args)) as
      | { proposals?: unknown[] }
      | null
      | undefined;
    return context?.proposals ?? null;
  },
);

jest.mock(
  "@/lib/programs/stage-readiness-workbooks/gate-proposal-context",
  () => ({
    loadStageReadinessGateProposals: (...args: unknown[]) =>
      mockLoadStageReadinessGateProposals(...args),
  }),
);

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
    // The refusal names the unreviewed workbook, not the approved evidence
    // family it would otherwise report as still open.
    await expect(res.json()).resolves.toMatchObject({
      error: "transition_evidence_incomplete",
      requiredEvidenceGaps: [
        expect.objectContaining({
          evidenceSlot: "P3 to P4 readiness workbook",
          status: "missing",
          nextAction:
            "Complete the P3 to P4 readiness workbook with an evidence-backed answer and source reference.",
        }),
      ],
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("takes the gate reading from the review as it stands, not from a finished one", async () => {
    // The two readings are driven apart here on purpose. This is the state a
    // reviewer can reach and could not leave: every REQUIRED response accepted,
    // answered and sourced, and one RECOMMENDED response left blank — which the
    // review surface cannot decide, so it stays pending forever. The
    // finished-only reading returns null for it, and a null there means the
    // gate sees no workbook at all, so the phase stayed shut on a workbook that
    // was complete for everything the gate requires.
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
    });
    mockLoadAcceptedStageReadinessContext.mockResolvedValue(null);
    mockLoadStageReadinessGateProposals.mockResolvedValueOnce([
      {
        questionId: "q_kpi_baseline",
        dimensionId: "contact_center_kpis",
        requirement: "required",
        answerState: "answered",
        disposition: "accepted",
        evidenceOrSource: "Existing evidence: ev-kpi",
      },
      {
        questionId: "q_optional_context",
        dimensionId: "nice_to_have_context",
        requirement: "recommended",
        answerState: "blank",
        disposition: "pending",
        evidenceOrSource: "",
      },
    ]);

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, newPhase: 4 });
    expect(mockLoadStageReadinessGateProposals).toHaveBeenCalledWith(
      ctx,
      "prog-1",
      4,
    );
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

  /**
   * The catch-all arm, driven through the route.
   *
   * This surface's reader wraps whatever the body offers in "the phase gate is
   * blocked" and appends its standing document remedy. With `detail` absent the
   * ladder landed on `error`, so a crash was reported to a product user as a
   * verdict — `internal_error` — with an approve-or-upload instruction that
   * cannot address a failure the gate never reached.
   */
  it("answers an unanticipated failure with a sentence, not with its error code", async () => {
    mockEvaluateGate.mockRejectedValue(
      new Error('relation "gate_rules" does not exist'),
    );

    const { POST } = await import("../route");
    const res = await POST(
      req({
        phase: 3,
        rationale: "Architecture reviewed and approved.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(500);
    expect(mockAdvancePhase).not.toHaveBeenCalled();

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toStrictEqual({
      error: "internal_error",
      detail: unexpectedWalkStepDetail("phase_gate_submission"),
    });
    expect(body).not.toHaveProperty("message");
    expect(JSON.stringify(body)).not.toContain("gate_rules");
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
    mockGetPhaseCaptureSections.mockReturnValue([
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_scope_boundary", status: "completed" },
    ]);
    mockListApprovedPhaseEvidence.mockResolvedValue([
      { evidenceId: "evidence-scope", familyKey: "charter_scope" },
    ]);
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
    mockGetPhaseCaptureSections.mockReturnValue([
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_scope_boundary", status: "completed" },
    ]);
    mockListApprovedPhaseEvidence.mockResolvedValue([
      { evidenceId: "evidence-scope", familyKey: "charter_scope" },
    ]);
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

  it("records the terminal phase it reports, not only the lifecycle", async () => {
    // The sibling case above asserts the engagements write with
    // `objectContaining`, which cannot notice a field that is absent. The
    // handoff wrote `lifecycle_state` and `gates_passed` and left
    // `current_phase` at 5 while the response said `newPhase: 6`, so the
    // readers that ask the phase rather than the lifecycle — the advance
    // control's `isFinal = currentPhase >= 6`, the CXO preview mode, and the
    // phase-6 deliverable set — all read a completed Move as still at P5.
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
    const body = (await res.json()) as {
      newPhase: number;
      transition: { toPhase: number };
    };
    const engagementWrite = writes.find(
      (write) => write.table === "engagements",
    );
    expect(engagementWrite).toBeDefined();
    // The phase is recorded, not merely reported.
    expect(engagementWrite?.payload.current_phase).toBe(6);
    // And the two agree, so one cannot drift from the other again.
    expect(body.newPhase).toBe(engagementWrite?.payload.current_phase);
    expect(body.transition.toPhase).toBe(
      engagementWrite?.payload.current_phase,
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

  it("blocks P1 approval when a completed capture lacks matching approved evidence", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 1,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_scope_boundary", status: "completed" },
    ]);
    mockListApprovedPhaseEvidence.mockResolvedValue([
      { evidenceId: "evidence-wrong-family", familyKey: "charter_sponsor" },
    ]);

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 1 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "capture_incomplete",
      phase: 1,
      missing: ["Scope boundary"],
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("counts approved P1 evidence only for its matching capture family", async () => {
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      currentPhase: 1,
      gatesPassed: [],
    });
    mockGetPhaseCaptureSections.mockReturnValue([
      {
        key: "sponsor_commitment",
        label: "Sponsor contact",
        evidenceFamily: "charter_sponsor",
      },
      {
        key: "scope_boundary",
        label: "Scope boundary",
        evidenceFamily: "charter_scope",
      },
    ]);
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_sponsor_commitment", status: "completed" },
      { moduleKey: "phase_1_scope_boundary", status: "completed" },
    ]);
    mockListApprovedPhaseEvidence.mockResolvedValue([
      { evidenceId: "evidence-sponsor", familyKey: "charter_sponsor" },
    ]);

    const { GET } = await import("../route");
    const incomplete = await GET(getReq(1) as never, { params });
    await expect(incomplete.json()).resolves.toMatchObject({
      capture: { complete: false, missing: ["Scope boundary"] },
      canApprove: false,
    });

    mockListApprovedPhaseEvidence.mockResolvedValue([
      { evidenceId: "evidence-sponsor", familyKey: "charter_sponsor" },
      { evidenceId: "evidence-scope", familyKey: "charter_scope" },
    ]);
    const complete = await GET(getReq(1) as never, { params });
    await expect(complete.json()).resolves.toMatchObject({
      capture: { complete: true, missing: [] },
    });
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
      outcome: "gate_hard_blocked",
      movePhase: 0,
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 0 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "gate_blocked" });
  });

  // The P0 close has five ways to stop and only ONE is a gate verdict. Before
  // this, the other four returned an empty `blockedBy` and this route turned
  // that emptiness into "Check server logs for the phase close helper." — for
  // a signed-in product user, on the first step of a Move.
  const p0AtPhase0 = () => {
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
  };

  it("does not report an already-advanced Move as a blocked gate", async () => {
    p0AtPhase0();
    mockCloseP0OnApproval.mockResolvedValue({
      advanced: false,
      newPhase: null,
      blockedBy: [],
      outcome: "already_past_p0",
      movePhase: 2,
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 0 }) as never, { params });
    const body = (await res.json()) as { error: string; detail: string };

    expect(body.error).toBe("already_advanced");
    expect(body.error).not.toBe("gate_blocked");
    expect(body.detail).toContain("P2");
    expect(body.detail).not.toMatch(/server log/i);
  });

  it("names the capture to re-check when the origination brief could not be built", async () => {
    p0AtPhase0();
    mockCloseP0OnApproval.mockResolvedValue({
      advanced: false,
      newPhase: null,
      blockedBy: [],
      outcome: "brief_not_created",
      movePhase: 0,
    });

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 0 }) as never, { params });
    const body = (await res.json()) as { error: string; detail: string };

    expect(body.error).toBe("brief_not_created");
    expect(body.detail).toMatch(/problem statement/i);
    expect(body.detail).not.toMatch(/server log/i);
  });

  // This sweep is the ONLY place the route's answer is checked for a stop that
  // is not the gate's own verdict, and the group it walks used to be a
  // hand-typed four. The close helper now reports six such stops: the list
  // stopped growing when the helper did, so the two newest reached this route
  // with nothing here exercising them. The group is imported from the module
  // that classifies it, which the compiler requires to be exhaustive.
  it("answers every non-gate stop with its own named refusal", async () => {
    for (const outcome of ORIGINATION_CLOSE_NON_GATE_STOPS) {
      p0AtPhase0();
      mockCloseP0OnApproval.mockResolvedValue({
        advanced: false,
        newPhase: null,
        blockedBy: [],
        outcome,
        movePhase: 0,
      });

      const { POST } = await import("../route");
      const res = await POST(req({ phase: 0 }) as never, { params });
      const body = (await res.json()) as {
        error: string;
        detail: string;
        outcome: string;
      };

      expect(res.status).toBe(409);
      expect(body.outcome).toBe(outcome);
      expect(body.detail).not.toMatch(/server log/i);
      expect(body.detail.length).toBeGreaterThan(0);
      // Only a real gate verdict may borrow the word.
      expect(body.error).not.toBe("gate_blocked");
      // The route must pass the stop's OWN code and sentence through rather
      // than collapsing the group onto one of them.
      expect(body.error).toBe(originationCloseErrorCode(outcome));
      expect(body.detail).toBe(
        describeOriginationCloseOutcome({
          outcome,
          blockedBy: [],
          movePhase: 0,
        }),
      );
    }
  });

  // The group above is iterated, so a member that quietly leaves it is not
  // failed — merely unchecked. Pin it against an independent property: a
  // non-gate stop is exactly an outcome whose error code is neither absent
  // (the success arm) nor `gate_blocked` (the verdict).
  it("derives the non-gate stops in agreement with the error codes", () => {
    for (const outcome of ORIGINATION_CLOSE_NON_GATE_STOPS) {
      const code = originationCloseErrorCode(outcome);
      expect(code).not.toBeNull();
      expect(code).not.toBe("gate_blocked");
    }
    // Exactly two outcomes are excluded — the success arm and the gate's own
    // verdict — so the group's size is pinned rather than merely non-empty. A
    // group that shrinks fails here instead of silently sweeping less.
    expect(ORIGINATION_CLOSE_NON_GATE_STOPS).toHaveLength(
      ORIGINATION_CLOSE_OUTCOMES.length - 2,
    );
    expect(ORIGINATION_CLOSE_NON_GATE_STOPS).not.toContain("advanced");
    expect(ORIGINATION_CLOSE_NON_GATE_STOPS).not.toContain("gate_hard_blocked");
    // Every stop the group names is distinct, so no outcome is swept twice
    // while another is swept not at all.
    expect(new Set(ORIGINATION_CLOSE_NON_GATE_STOPS).size).toBe(
      ORIGINATION_CLOSE_NON_GATE_STOPS.length,
    );
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

/**
 * The slot list this route refuses with comes from a discovery blueprint, and
 * the readiness pack records what chose that blueprint. Both facts stopped at
 * the packet builder, so a refusal measured against an INFERRED framework
 * called its slots "Required evidence" in the same words it uses for a declared
 * one. Nothing here relaxes the gate: the 409 still refuses and no phase
 * advances. Only the claim about where the list came from changes.
 */
describe("the transition refusal states what chose the framework it measured", () => {
  it("does not call an inferred framework's slots a declared requirement", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "inferred",
      archetypeLabel: "Contact Center Agent Assist",
      unknownDeclaredArchetype: null,
    });
    mockLoadAcceptedStageReadinessContext.mockResolvedValueOnce(null);
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      detail: string;
      evidenceFramework: { declared: boolean; origin: string } | null;
      requiredEvidenceGaps: unknown[];
    };
    expect(body.error).toBe("transition_evidence_incomplete");
    expect(body.evidenceFramework).toMatchObject({
      declared: false,
      origin: "inferred",
    });
    expect(body.detail).toMatch(/not a declared requirement/);
    expect(body.detail).toContain("Contact Center Agent Assist");
    // The route's own wording still leads, and the named slots are untouched.
    expect(body.detail.startsWith("Required evidence must be approved")).toBe(
      true,
    );
    expect(body.requiredEvidenceGaps.length).toBeGreaterThan(0);
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("names a discarded declaration in the refusal rather than the framework that replaced it", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "inferred",
      archetypeLabel: "Contact Center Agent Assist",
      unknownDeclaredArchetype: "governed_data_foundaton",
    });
    mockLoadAcceptedStageReadinessContext.mockResolvedValueOnce(null);
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      evidenceFramework: {
        declared: false,
        origin: "declaration_discarded",
        discardedDeclaration: "governed_data_foundaton",
      },
    });
  });

  it("leaves a declared framework's refusal wording exactly as it was", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "declared",
      archetypeLabel: "Governed Data Foundation",
      unknownDeclaredArchetype: null,
    });
    mockLoadAcceptedStageReadinessContext.mockResolvedValueOnce(null);
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      detail: string;
      evidenceFramework: { declared: boolean } | null;
    };
    expect(body.evidenceFramework).toMatchObject({ declared: true });
    expect(body.detail).toBe(
      "Required evidence must be approved, linked to a sourced workbook answer, or formally resolved before this phase can close.",
    );
  });

  it("reports the framework on the readiness read, not only on the refusal", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "default",
      archetypeLabel: "General Case",
      unknownDeclaredArchetype: null,
    });
    const { GET } = await import("../route");
    const res = await GET(getReq(3) as never, { params });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      transitionReadiness: {
        evidenceFramework: { declared: false, origin: "default" },
      },
    });
  });

  it("reports no framework at all when readiness could not be read", async () => {
    // `available: false` already says the readiness read failed. The framework
    // must then be absent rather than defaulted, so a reader cannot mistake
    // "not asked" for "declared".
    mockLoadDiscoveryEvidenceReadiness.mockRejectedValue(
      new Error("readiness_unavailable"),
    );
    const { GET } = await import("../route");
    const res = await GET(getReq(3) as never, { params });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      transitionReadiness: { available: false, evidenceFramework: null },
    });
  });
});

/**
 * The gate's transition-evidence read is five steps behind one flag.
 *
 * It ran under a single bare `try` whose `catch` answered every cause with one
 * HTTP 503 — a retry instruction — and logged nothing. Two of the five steps are
 * reads a re-submission can plausibly answer; three are pure reductions over
 * records already on the Move, where a re-submission recomputes the same inputs
 * and fails the same way. These cases drive the three causes apart through the
 * route and pin which refusal each one sends.
 *
 * None of them relaxes the gate: `advancePhase` must stay uncalled throughout.
 */
describe("a transition-evidence refusal names the step that failed", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("sends an unreadable discovery readiness as a retryable 503", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockRejectedValue(
      new Error("pg: connection terminated"),
    );
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(503);
    const body = (await res.json()) as {
      error: string;
      precondition: string;
      basisUnevaluableCause: string;
      resubmitCanSatisfy: boolean;
      detail: string;
    };
    expect(body.error).toBe("transition_discovery_readiness_unreadable");
    // The code a reader of the old refusal matched on is kept.
    expect(body.precondition).toBe("transition_evidence_readiness_unavailable");
    expect(body.basisUnevaluableCause).toBe("discovery_readiness_unreadable");
    expect(body.resubmitCanSatisfy).toBe(true);
    expect(body.detail).toContain("was not reached");
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("distinguishes an unreadable workbook review from an unreadable readiness", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "declared",
      archetypeLabel: "Governed Data Foundation",
      unknownDeclaredArchetype: null,
    });
    mockLoadStageReadinessGateProposals.mockRejectedValueOnce(
      new Error("workbook read failed"),
    );
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(503);
    const body = (await res.json()) as {
      error: string;
      basisUnevaluableCause: string;
      resubmitCanSatisfy: boolean;
      detail: string;
    };
    expect(body.error).toBe("transition_workbook_review_unreadable");
    expect(body.basisUnevaluableCause).toBe("workbook_review_unreadable");
    expect(body.resubmitCanSatisfy).toBe(true);
    // Readiness DID answer here, so the refusal must say so.
    expect(body.detail).toContain("discovery evidence readiness was read, but");
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("does not prescribe a re-submission for a failed gap assessment", async () => {
    // Both reads answered; the reduction threw. This is the case the single 503
    // got wrong: re-submitting reduces the same records the same way.
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "declared",
      archetypeLabel: "Governed Data Foundation",
      unknownDeclaredArchetype: null,
    });
    mockLoadAcceptedStageReadinessContext.mockResolvedValueOnce(null);
    mockBuildMoveEvidenceNeedPackets.mockImplementationOnce(() => {
      throw new Error("packet expansion failed");
    });
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      error: string;
      basisUnevaluableCause: string;
      resubmitCanSatisfy: boolean;
      detail: string;
    };
    expect(body.error).toBe("transition_evidence_assessment_failed");
    expect(body.basisUnevaluableCause).toBe("gap_assessment_failed");
    expect(body.resubmitCanSatisfy).toBe(false);
    expect(body.detail).toContain(
      "Submitting the gate again will not change the answer",
    );
    expect(body.detail).not.toMatch(/submit the gate again;/i);
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("logs the failing step and its error so a stuck Move leaves a trace", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockRejectedValue(
      new Error("pg: connection terminated"),
    );
    const { POST } = await import("../route");
    await POST(req({ phase: 3 }) as never, { params });

    const logged = errorSpy.mock.calls
      .map((call) => String(call[0]))
      .join("\n");
    expect(logged).toContain("cause=discovery_readiness_unreadable");
    expect(logged).toContain("phase=3");
    expect(logged).toContain("pg: connection terminated");
  });

  it("reports the failing step on the readiness read too", async () => {
    mockLoadDiscoveryEvidenceReadiness.mockRejectedValue(
      new Error("pg: connection terminated"),
    );
    const { GET } = await import("../route");
    const res = await GET(getReq(3) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      transitionReadiness: {
        available: false,
        basisUnevaluable: {
          cause: "discovery_readiness_unreadable",
          resubmitCanSatisfy: true,
        },
      },
    });
  });

  it("reports no unevaluable cause when the read succeeded", async () => {
    // The mirror of the case above: a measured gate must not carry a fault.
    mockLoadDiscoveryEvidenceReadiness.mockResolvedValue({
      blueprintBasis: "declared",
      archetypeLabel: "Governed Data Foundation",
      unknownDeclaredArchetype: null,
    });
    const { GET } = await import("../route");
    const res = await GET(getReq(3) as never, { params });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      transitionReadiness: { available: boolean; basisUnevaluable: unknown };
    };
    expect(body.transitionReadiness.available).toBe(true);
    expect(body.transitionReadiness.basisUnevaluable).toBeNull();
  });

  it("asks nothing of the transition-evidence read outside P1-P4", async () => {
    // The early return is the declared not-applicable bound. A phase outside it
    // must not produce a fault, and must not issue the reads at all.
    mockLoadDiscoveryEvidenceReadiness.mockRejectedValue(
      new Error("must not be called"),
    );
    const { GET } = await import("../route");
    const res = await GET(getReq(5) as never, { params });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      transitionReadiness: { available: boolean; basisUnevaluable: unknown };
    };
    expect(body.transitionReadiness.available).toBe(true);
    expect(body.transitionReadiness.basisUnevaluable).toBeNull();
  });
});

// The 404 leg had NO case in this 1800-line suite before these: all 39
// pre-existing cases resolved `getProgramById` to a program. Unlike the advance
// route, this one loads the Move BEFORE it fences on the grant list, so this
// 404 is also the answer for a Move the caller's grants exclude — the 403 below
// it re-tests that identical predicate and can only be reached by a caller who
// may read the Move but may not approve gates.
describe("POST /api/v1/programs/[programId]/phase-gate-approval · unreadable Move", () => {
  beforeEach(() => {
    mockGetProgramById.mockResolvedValue(null);
  });

  it("refuses with the sentence the workspace ladder shows instead of the code", async () => {
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error?: string; detail?: string };
    expect(body.error).toBe("not_found");
    expect(body.detail).toBe(MOVE_UNREADABLE_REFUSAL_DETAIL);
  });

  it("rules the re-submission out, because no re-submission clears any cause", async () => {
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    const body = (await res.json()) as { resubmitCanSatisfy?: unknown };
    expect(body.resubmitCanSatisfy).toBe(false);
  });

  it("sends the shared body and nothing cause-specific", async () => {
    // Three causes reach this one `null`: grants exclude the Move, no row for
    // the id, or the id belongs to another tenant. One body for all three is
    // what keeps the refusal from answering "does this Move exist?".
    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(await res.json()).toEqual(
      moveUnreadableRefusalBody({ withResubmitSignal: true }),
    );
  });

  it("refuses before it reads evidence or evaluates the gate", async () => {
    const { POST } = await import("../route");
    await POST(req({ phase: 3 }) as never, { params });

    expect(mockEvaluateGate).not.toHaveBeenCalled();
  });
});
