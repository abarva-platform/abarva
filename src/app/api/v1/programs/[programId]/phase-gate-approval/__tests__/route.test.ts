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
const mockEvaluateGate = jest.fn();
const mockAdvancePhase = jest.fn();
const mockCloseP0OnApproval = jest.fn();
const mockWriteProgramAuditLogBestEffort = jest.fn();
const mockSaveGateDecisionArtifact = jest.fn();
const mockGetPhaseCaptureSections = jest.fn();
const mockPersistP0PhaseCaptureFromSource = jest.fn();
const mockSbFrom = jest.fn();

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

jest.mock("@/lib/programs/phase-capture-contract", () => ({
  getPhaseCaptureSections: (phase: number) =>
    mockGetPhaseCaptureSections(phase),
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

function req(body: unknown): Request {
  return new Request("http://test/api/v1/programs/prog-1/phase-gate-approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
  // Capture is complete by default so tests can focus on the gate check.
  mockGetPhaseCaptureSections.mockReturnValue([
    { key: "review", label: "Review" },
  ]);
  mockGetModuleState.mockResolvedValue([
    { moduleKey: "phase_3_review", status: "completed" },
  ]);
  mockGetPhaseSnapshots.mockResolvedValue([]);
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
  it("blocks approval on a hard gate failure and fabricates nothing", async () => {
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "design_approved",
          reason: "No approved P3 architecture deliverable exists",
          severity: "hard",
        },
      ],
      requiresApproval: false,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({ phase: 3, rationale: "Reviewed and approved." }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "gate_blocked" });
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

  it("completes terminal P5 from signed deliverable gates and records gate 5 even when duplicate capture text is absent", async () => {
    const writes: Array<{ table: string; payload: Record<string, unknown> }> =
      [];
    mockGetProgramById.mockResolvedValue({
      id: "prog-1",
      name: "MEMBER AI ASSIST",
      currentPhase: 5,
      gatesPassed: [],
    });
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
          }),
        }),
        expect.objectContaining({
          table: "engagements",
          payload: expect.objectContaining({
            lifecycle_state: "completed",
            gates_passed: [5],
          }),
        }),
        expect.objectContaining({
          table: "module_state_log",
          payload: expect.objectContaining({
            module_key: "phase_5",
            new_state: "completed",
          }),
        }),
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

  it("short-circuits when the phase is already approved", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([{ approvalStatus: "approved" }]);

    const { POST } = await import("../route");
    const res = await POST(req({ phase: 3 }) as never, { params });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ alreadyApproved: true });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
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
