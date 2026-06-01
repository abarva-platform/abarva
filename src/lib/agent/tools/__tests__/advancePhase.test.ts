/** advance_phase tool tests */

const requireTenancyMock = jest.fn();
jest.mock("@/app/api/v1/programs/_auth", () => {
  class TenancyError extends Error {
    constructor(public readonly code: "unauthenticated" | "no_client") {
      super(code);
    }
  }
  return {
    __esModule: true,
    requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
    TenancyError,
  };
});

const getProgramByIdMock = jest.fn();
jest.mock("@/lib/programs/queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const evaluateGateMock = jest.fn();
const requestFounderApprovalMock = jest.fn();
jest.mock("@/lib/programs/governance", () => ({
  __esModule: true,
  evaluateGate: (...args: unknown[]) => evaluateGateMock(...args),
  requestFounderApproval: (...args: unknown[]) =>
    requestFounderApprovalMock(...args),
}));

const advancePhaseMutationMock = jest.fn();
jest.mock("@/lib/programs/mutations", () => ({
  __esModule: true,
  advancePhase: (...args: unknown[]) => advancePhaseMutationMock(...args),
}));

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock("@/lib/auth/program-access-policy", () => ({
  __esModule: true,
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

import { advancePhaseTool } from "../program/advancePhase";

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    request: new Request("http://localhost/"),
    surface: "/programs/program-1",
    ...overrides,
  };
}

const tenancy = {
  clientId: "client-1",
  userId: "person-1",
  role: "Director, IT Procurement",
};

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue(tenancy);
  getProgramByIdMock.mockResolvedValue({ id: "program-1", currentPhase: 3 });
  evaluateGateMock.mockResolvedValue({
    failedChecks: [],
    requiresApproval: true,
    approverRole: "sponsor",
  });
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    programIdsAllowed: null,
    canApproveGates: true,
    canViewFinancialData: false,
  });
  requestFounderApprovalMock.mockResolvedValue("approval-1");
  advancePhaseMutationMock.mockResolvedValue({
    programId: "program-1",
    newPhase: 4,
    snapshotId: "snapshot-1",
  });
});

describe("advance_phase tool", () => {
  // SECURITY (audit 2026-05-22, P2-8): the agent never SATISFIES a gate
  // approval. Even with gate-approval rights it only ever CREATES a
  // pending approval request; self-approval is a deterministic UI action.
  it("creates an approval request — never self-approves — when a gate requires approval", async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        rationale: "Carlos approved in E2E test.",
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("approval_required");
    expect(requestFounderApprovalMock).toHaveBeenCalledWith(
      tenancy,
      "program-1",
      expect.objectContaining({
        requestType: "phase_gate",
        headline: "Approve phase 3 → 4 gate",
      }),
    );
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("creates the sponsor approval request when no override is requested", async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        rationale:
          "I reviewed the gate evidence and request sponsor approval for this advance.",
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("approval_required");
    expect(requestFounderApprovalMock).toHaveBeenCalledWith(
      tenancy,
      "program-1",
      expect.objectContaining({
        requestType: "phase_gate",
        headline: "Approve phase 3 → 4 gate",
      }),
    );
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("refuses a gate bypass when the session lacks gate approval rights", async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
      canViewFinancialData: false,
    });

    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        bypass_gate: true,
        rationale:
          "I reviewed the gate evidence and request a sponsor override for this advance.",
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toBe("approval_permission_required");
    expect(requestFounderApprovalMock).not.toHaveBeenCalled();
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("advances directly when no gate approval is required", async () => {
    evaluateGateMock.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });

    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        rationale:
          "I reviewed the gate evidence and approve advancing this Move.",
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    expect(requestFounderApprovalMock).not.toHaveBeenCalled();
    expect(advancePhaseMutationMock).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        programId: "program-1",
        fromPhase: 3,
        toPhase: 4,
        approvedByUserId: undefined,
        snapshot: expect.objectContaining({
          humanRationale:
            "I reviewed the gate evidence and approve advancing this Move.",
          aiDecisionEvidencePacket: expect.objectContaining({
            recommendationId: "moves-phase-gate:program-1:P3->P4",
          }),
        }),
      }),
    );
  });

  it("requires a human rationale before the tool can commit a phase advance", async () => {
    evaluateGateMock.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });

    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("human_rationale_required");
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("serializes non-Error mutation failures instead of returning [object Object]", async () => {
    evaluateGateMock.mockResolvedValue({
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });
    advancePhaseMutationMock.mockRejectedValue({
      code: "23514",
      message: 'violates check constraint "engagements_current_phase_check"',
    });

    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        rationale:
          "I reviewed the gate evidence and approve advancing this Move.",
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("23514");
      expect(result.error).toContain("engagements_current_phase_check");
      expect(result.error).not.toContain("[object Object]");
    }
  });
});
