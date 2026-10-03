const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetProgramById = jest.fn();
const mockEvaluateGate = jest.fn();
const mockDecideApproval = jest.fn();
const mockAdvancePhase = jest.fn();
const mockResolvePhaseGateActorPersonId = jest.fn();

jest.mock("../../../_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadUserProgramAccessPolicy(ctx, opts),
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string, opts: unknown) =>
    mockGetProgramById(ctx, programId, opts),
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: (
    ctx: unknown,
    programId: string,
    fromPhase: number,
    toPhase: number,
    opts: unknown,
  ) => mockEvaluateGate(ctx, programId, fromPhase, toPhase, opts),
  decideApproval: (...args: unknown[]) => mockDecideApproval(...args),
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase: (ctx: unknown, input: unknown, opts: unknown) =>
    mockAdvancePhase(ctx, input, opts),
}));

jest.mock("@/lib/programs/phase-gate-actor", () => ({
  resolvePhaseGateActorPersonId: (ctx: unknown) =>
    mockResolvePhaseGateActorPersonId(ctx),
}));

jest.mock("@/lib/programs/move-progress-notifications", () => ({
  sendMoveProgressUpdate: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: () => ({
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: jest.fn() }),
          }),
        }),
      }),
    },
  }),
}));

jest.mock("@/lib/auth/gate-approval-strict-mode", () => ({
  isGateApprovalStrictMode: () => false,
  isStrictModeApprovalRole: () => true,
}));

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: jest.fn() }),
        }),
      }),
    }),
  }),
}));

function req(body: unknown): Request {
  return new Request("http://test/api/v1/programs/prog-1/advance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ programId: "prog-1" });
const ctx = { clientId: "client-1", userId: "person-1", role: "client_admin" };

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({
    ...ctx,
    clientKey: "apex-retail",
    email: "maya@example.com",
  });
  mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 0 });
  mockEvaluateGate.mockResolvedValue({
    failedChecks: [],
    requiresApproval: true,
    approverRole: "approver",
  });
  mockAdvancePhase.mockResolvedValue({
    programId: "prog-1",
    newPhase: 1,
    snapshotId: "snap-1",
  });
  mockResolvePhaseGateActorPersonId.mockResolvedValue({
    ok: true,
    personId: "person-1",
  });
});

describe("POST /api/v1/programs/[programId]/advance", () => {
  it("self-approves phase advancement for callers with gate approval rights", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        selfApproveIfAuthorized: true,
        snapshot: { source: "test" },
        humanRationale:
          "I reviewed the phase gate evidence and approve advancing this Move.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, newPhase: 1 });
    expect(mockResolvePhaseGateActorPersonId).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "person-1" }),
    );
    expect(mockAdvancePhase).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "person-1" }),
      expect.objectContaining({
        programId: "prog-1",
        fromPhase: 0,
        toPhase: 1,
        approvedByUserId: "person-1",
        snapshot: expect.objectContaining({
          humanRationale:
            "I reviewed the phase gate evidence and approve advancing this Move.",
          aiDecisionEvidencePacket: expect.objectContaining({
            recommendationId: "moves-phase-gate:prog-1:P0->P1",
          }),
        }),
      }),
      expect.anything(),
    );
  });

  it("requires the authorized user to submit an explicit approval action", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        humanRationale:
          "The authorized workspace user reviewed the current gate evidence.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "explicit_approval_required",
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("does not create a second approver path for a user without gate permission", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
    });
    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        selfApproveIfAuthorized: true,
        humanRationale:
          "I reviewed the phase gate evidence and request approval for this Move.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "forbidden",
      detail: "Only an authorized workspace user can approve a phase gate.",
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("returns a setup error instead of writing a Clerk id into UUID-backed audit fields", async () => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-1",
      clientKey: "skyharbor",
      userId: "clerk:user_3EJHfSpLrv95DZg2h1cgpUT0cld",
      role: "client_admin",
      email: "anand.sundaram+skyharbor@thesundaram.com",
    });
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockResolvePhaseGateActorPersonId.mockResolvedValue({
      ok: false,
      error: "person_row_required",
      detail:
        "No tenant-scoped persons row was found for anand.sundaram+skyharbor@thesundaram.com; provision the operator/buyer persona before advancing this Move.",
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        selfApproveIfAuthorized: true,
        humanRationale:
          "I reviewed the phase gate evidence and approve advancing this Move.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "operator_person_required",
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("requires a human rationale before stage advance", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true }) as never,
      { params },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "human_rationale_required",
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("blocks hard gate failures even when the caller has self-approval rights", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "program_seed_recorded",
          reason: "P0 seed artifact must be signed off",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        selfApproveIfAuthorized: true,
        humanRationale:
          "I reviewed the phase gate evidence and approve advancing this Move.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "gate_blocked",
      detail:
        "Hard-gate checks must pass before advance: P0 seed artifact must be signed off",
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized bypassGate attempt from a caller without gate-approval rights", async () => {
    // Phase Advancement Control audit, scenario "unauthorized override":
    // bypassGate must require the explicit workspace permission regardless
    // of gate state or role name.
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
    });
    mockRequireTenancy.mockResolvedValue({
      ...ctx,
      clientKey: "apex-retail",
      email: "maya@example.com",
      role: "founder",
    });
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        bypassGate: true,
        humanRationale: "Attempting to bypass without gate-approval rights.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "forbidden",
      detail: "Only an authorized workspace user can approve a phase gate.",
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("authorized bypassGate still never lets a hard gate failure through (no hard-override capability exists)", async () => {
    // Phase Advancement Control audit, scenario "authorized override": even
    // a caller WITH canApproveGates and an explicit bypassGate=true is
    // blocked by any hard-severity check — the hard-fail 409 runs
    // unconditionally, before bypassGate is ever consulted.
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "design_approved",
          reason: "No approved P3 architecture deliverable exists",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 4,
        bypassGate: true,
        humanRationale: "Explicitly authorized bypass attempt.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ error: "gate_blocked" });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("does not let a founder role name replace workspace gate permission on legacy approval decisions", async () => {
    mockRequireTenancy.mockResolvedValue({
      ...ctx,
      clientKey: "apex-retail",
      email: "maya@example.com",
      role: "founder",
    });
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
    });

    const { POST: decideApproval } =
      await import("@/app/api/v1/programs/[programId]/approvals/[approvalId]/decide/route");
    const res = await decideApproval(req({ decision: "approved" }) as never, {
      params: Promise.resolve({
        programId: "prog-1",
        approvalId: "approval-1",
      }),
    });

    expect(res.status).toBe(403);
    expect(mockDecideApproval).not.toHaveBeenCalled();
  });

  it("labels a soft-carry-only advance as softGapsCarried, never as an override", async () => {
    // Phase Advancement Control audit, scenario "misleading override
    // labeling": a normal, hard-gate-clean pass with an unmet soft
    // criterion must report softGapsCarried:true and hardGateOverride:null
    // in gateDecision — never a bare "override" flag.
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [
        {
          check: "optional_stakeholder_review",
          reason: "Not logged",
          severity: "soft",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 1,
        selfApproveIfAuthorized: true,
        humanRationale: "Reviewed and approved with a soft gap noted.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      gateDecision: expect.objectContaining({
        softGapsCarried: true,
        hardGateOverride: null,
        carriedGaps: ["optional_stakeholder_review"],
      }),
    });
  });
});

describe("POST /api/v1/programs/[programId]/approvals", () => {
  it("retires separate sponsor approval requests after workspace authorization", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    const { POST } = await import("../../approvals/route");
    const res = await POST(
      req({
        requestType: "phase_gate",
        headline: "Please ask the sponsor to approve",
        approverRole: "sponsor",
      }) as never,
      { params },
    );

    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toMatchObject({
      error: "approval_requests_retired",
    });
  });
});

export {};
