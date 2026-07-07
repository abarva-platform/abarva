const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetProgramById = jest.fn();
const mockEvaluateGate = jest.fn();
const mockRequestFounderApproval = jest.fn();
const mockAdvancePhase = jest.fn();
const mockSupabaseMaybeSingle = jest.fn();
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
  requestFounderApproval: (
    ctx: unknown,
    programId: string,
    input: unknown,
    opts: unknown,
  ) => mockRequestFounderApproval(ctx, programId, input, opts),
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase: (ctx: unknown, input: unknown, opts: unknown) =>
    mockAdvancePhase(ctx, input, opts),
}));

jest.mock("@/lib/programs/phase-gate-actor", () => ({
  resolvePhaseGateActorPersonId: (ctx: unknown) =>
    mockResolvePhaseGateActorPersonId(ctx),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: () => ({
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: mockSupabaseMaybeSingle }),
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
    approverRole: "sponsor",
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
    expect(mockRequestFounderApproval).not.toHaveBeenCalled();
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

  it("creates an approval request when the caller cannot self-approve the gate", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
    });
    mockRequestFounderApproval.mockResolvedValue("approval-1");

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

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      error: "approval_required",
      approvalId: "approval-1",
    });
    expect(mockRequestFounderApproval).toHaveBeenCalled();
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
    expect(mockRequestFounderApproval).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("requires a human rationale before stage advance or approval request", async () => {
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
    expect(mockRequestFounderApproval).not.toHaveBeenCalled();
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
    expect(mockRequestFounderApproval).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });
});

export {};
