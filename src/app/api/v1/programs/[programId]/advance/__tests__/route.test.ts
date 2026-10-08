import {
  MOVE_UNREADABLE_REFUSAL_DETAIL,
  moveUnreadableRefusalBody,
} from "@/lib/programs/move-unreadable-refusal";
import { unexpectedWalkStepDetail } from "@/lib/programs/walk-step-unexpected-failure";

const mockRequireTenancy = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockEvaluateGate = jest.fn();
const mockListApprovedPhaseEvidence = jest.fn();
const mockDecideApproval = jest.fn();
const mockAdvancePhase = jest.fn();
const mockResolvePhaseGateActorPersonId = jest.fn();
const mockSendMoveProgressUpdate = jest.fn();

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
  getModuleState: (ctx: unknown, programId: string) =>
    mockGetModuleState(ctx, programId),
}));

jest.mock("@/lib/programs/approved-phase-evidence", () => ({
  listApprovedPhaseEvidence: (ctx: unknown, programId: string, phase: number) =>
    mockListApprovedPhaseEvidence(ctx, programId, phase),
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
  sendMoveProgressUpdate: (input: unknown) => mockSendMoveProgressUpdate(input),
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
  mockGetModuleState.mockResolvedValue([]);
  mockListApprovedPhaseEvidence.mockResolvedValue([]);
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
  mockSendMoveProgressUpdate.mockResolvedValue(undefined);
});

describe("POST /api/v1/programs/[programId]/advance", () => {
  it("blocks direct P1 advancement when capture evidence is not approved", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockGetProgramById.mockResolvedValue({ id: "prog-1", currentPhase: 1 });
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_1_sponsor_commitment", status: "completed" },
      { moduleKey: "phase_1_scope_boundary", status: "completed" },
      { moduleKey: "phase_1_success_criteria", status: "completed" },
      { moduleKey: "phase_1_stakeholder_map", status: "completed" },
      { moduleKey: "phase_1_decision_rights", status: "completed" },
      { moduleKey: "phase_1_evidence_plan", status: "completed" },
      {
        moduleKey: "phase_1_business_change_assessment",
        status: "completed",
      },
    ]);

    const { POST } = await import("../route");
    const res = await POST(
      req({
        toPhase: 2,
        selfApproveIfAuthorized: true,
        humanRationale: "P1 fields were reviewed before advancing.",
      }) as never,
      { params },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "capture_incomplete",
      phase: 1,
      missing: expect.arrayContaining([
        "Sponsor contact and progress updates",
        "Scope boundary",
      ]),
    });
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  /**
   * The catch-all arm, driven through the route rather than asserted on the
   * module.
   *
   * `advancePhase` commits, and then two awaited calls run inside the same
   * `try` with no local catch of their own: the gate decision record and the
   * progress notification. The notification is the easier of the two to drive
   * and the comment above the record calls both "best-effort", which the code
   * does not implement — a throw in either answers 500 with the phase already
   * moved. `PhaseAdvanceButton` reads `body.detail`, so before this the reader
   * was told "Failed to advance phase" about a Move that had advanced.
   */
  it("answers a post-advance failure with a sentence that does not deny the phase moved", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockSendMoveProgressUpdate.mockRejectedValue(
      new Error('relation "move_progress_outbox" does not exist'),
    );

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

    expect(res.status).toBe(500);
    // The advance itself did happen. That is what makes the old wording wrong,
    // so assert it rather than assume it.
    expect(mockAdvancePhase).toHaveBeenCalled();

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toStrictEqual({
      error: "internal_error",
      detail: unexpectedWalkStepDetail("phase_advance"),
    });
    // The raw error text was the whole of the old body and no client declared a
    // field for it. It must not come back.
    expect(body).not.toHaveProperty("message");
    expect(JSON.stringify(body)).not.toContain("move_progress_outbox");
  });

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

// The program allowlist fence. Every case above sets `programIdsAllowed: null`,
// so until these the route's first guard — and the only refusal a workspace
// user cannot clear by retrying — had no coverage at all.
describe("POST /api/v1/programs/[programId]/advance · program allowlist fence", () => {
  const rationale =
    "I reviewed the phase gate evidence and request approval for this Move.";

  it("refuses a restricted caller whose grants omit the Move, in a sentence", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: ["prog-7", "prog-8"],
      canApproveGates: true,
    });
    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true, humanRationale: rationale }) as never,
      { params },
    );

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string; detail?: string };
    expect(body.error).toBe("forbidden");
    expect(body.detail).toContain("authorized to work in 2 Moves");
    expect(body.detail).toContain("administrator");
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("refuses a caller with no grants at all, in a sentence", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: [],
      canApproveGates: true,
    });
    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true, humanRationale: rationale }) as never,
      { params },
    );

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string; detail?: string };
    expect(body.error).toBe("forbidden");
    expect(body.detail).toContain("not authorized to work in any Move");
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("answers the fence without reading the Move, so the refusal cannot imply the id exists", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: ["prog-7"],
      canApproveGates: true,
    });
    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true, humanRationale: rationale }) as never,
      { params },
    );

    expect(res.status).toBe(403);
    expect(mockGetProgramById).not.toHaveBeenCalled();
  });

  it("still lets a restricted caller advance a Move the account is granted", async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: ["prog-7", "prog-1"],
      canApproveGates: true,
    });
    mockEvaluateGate.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
    });
    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, selfApproveIfAuthorized: true, humanRationale: rationale }) as never,
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockAdvancePhase).toHaveBeenCalled();
  });
});

// The 404 leg had NO case in this suite before these: every case above resolves
// `getProgramById` to a program, so the refusal a reader meets when the Move
// stops being readable mid-session was untested, and it carried a bare code the
// button turned into "Failed to advance phase".
//
// What can reach it is narrower than it looks, and the allowlist fence above is
// why: that fence answers a Move outside the caller's grants with a 403 before
// this route loads anything, which is the INVERSE of the phase-gate-approval
// route, where the loader answers first and folds the grant case into its 404.
// So this 404 means "no row for this id in the active client" — an absent Move,
// or one belonging to another tenant. The fence's own ordering is pinned by
// "answers the fence without reading the Move" above; these cases pin what the
// refusal says once the fence has passed.
describe("POST /api/v1/programs/[programId]/advance · unreadable Move", () => {
  const rationale = "P0 was reviewed before advancing.";

  beforeEach(() => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: true,
    });
    mockGetProgramById.mockResolvedValue(null);
  });

  it("refuses with a sentence the advance button can show", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, humanRationale: rationale }) as never,
      { params },
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error?: string; detail?: string };
    expect(body.error).toBe("not_found");
    // `PhaseAdvanceButton` reads `body.detail ?? "Failed to advance phase"`.
    expect(typeof body.detail).toBe("string");
    expect(body.detail).toBe(MOVE_UNREADABLE_REFUSAL_DETAIL);
  });

  it("answers the no-row cause with the shared body and nothing cause-specific", async () => {
    // One code path, one body: the route hands the builder no cause, so a
    // caller cannot read the refusal to learn whether the Move exists, and it
    // emits no resubmission signal here because nothing on this surface reads
    // one.
    const { POST } = await import("../route");
    const res = await POST(
      req({ toPhase: 1, humanRationale: rationale }) as never,
      { params },
    );

    expect(await res.json()).toEqual(moveUnreadableRefusalBody());
  });

  it("refuses before it advances the phase", async () => {
    const { POST } = await import("../route");
    await POST(
      req({
        toPhase: 1,
        selfApproveIfAuthorized: true,
        humanRationale: rationale,
      }) as never,
      { params },
    );

    expect(mockAdvancePhase).not.toHaveBeenCalled();
    expect(mockEvaluateGate).not.toHaveBeenCalled();
  });
});

export {};
