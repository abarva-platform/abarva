/**
 * advance_phase · a governed transition is not refused for being non-adjacent.
 *
 * The tool's adjacency guard was arithmetic: `to_phase !== fromPhase + 1`
 * refused the request unless the caller also asked to BYPASS the gate. The
 * governance layer, however, declares the set of transitions that exist, and
 * that set is not "every from+1 pair" — `findGateRule` resolves an opt-in
 * transition (P1 -> P5) for a Move whose tenant and tier make it eligible,
 * and `evaluateGate` evaluates it against a real hard criterion.
 *
 * So the arithmetic guard refused a transition the governance layer fully
 * implements, and the only alternative it offered was `bypass_gate` — which
 * SKIPS the gate that exists precisely to govern that jump. The governed path
 * was unreachable through this tool; the ungoverned one was not.
 *
 * These cases pin the guard to the rule source instead: a pair the evaluator
 * reports no rule for is still refused with the same error, an adjacent pair
 * is unchanged, and a pair the evaluator governs is routed into the normal
 * approval flow rather than rejected.
 */

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
// `findGateRule` stays REAL: the last case asserts the admitted transition is
// one the rule source actually declares, so the behavioural cases above cannot
// pin a guard against a pair production never presents.
jest.mock("@/lib/programs/governance", () => ({
  __esModule: true,
  ...jest.requireActual<Record<string, unknown>>("@/lib/programs/governance"),
  evaluateGate: (...args: unknown[]) => evaluateGateMock(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: jest.fn() }),
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
import { findGateRule } from "@/lib/programs/governance";

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    request: new Request("http://localhost/"),
    surface: "/programs/program-1",
    ...overrides,
  };
}

/** A gate the evaluator governs and that is ready for an approver. */
const GOVERNED_READY = {
  pass: true,
  failedChecks: [],
  requiresApproval: true,
  approverRole: "approver",
};

/** What `evaluateGate` returns for a pair no rule covers. */
function noRuleResult(fromPhase: number, toPhase: number) {
  return {
    pass: false,
    failedChecks: [
      {
        check: "no_rule",
        reason: `No gate rule for ${fromPhase}→${toPhase}`,
        severity: "hard" as const,
      },
    ],
    requiresApproval: false,
    approverRole: null,
  };
}

const RATIONALE =
  "An authorized workspace user asked for this advance in the session.";

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: "client-1",
    userId: "person-1",
    role: "Director, IT Procurement",
  });
  getProgramByIdMock.mockResolvedValue({ id: "program-1", currentPhase: 1 });
  evaluateGateMock.mockResolvedValue(GOVERNED_READY);
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    programIdsAllowed: null,
    canApproveGates: true,
    canViewFinancialData: false,
  });
  advancePhaseMutationMock.mockResolvedValue({
    programId: "program-1",
    newPhase: 5,
    snapshotId: "snapshot-1",
  });
});

describe("advance_phase · adjacency is decided by the rule source", () => {
  it("routes a governed non-adjacent transition into the approval flow instead of refusing it", async () => {
    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 5, rationale: RATIONALE },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).not.toBe("non_adjacent_phase");
      expect(result.error).toBe("approval_required");
    }
    // The evaluator must actually be consulted for the requested pair —
    // the guard cannot answer this from `fromPhase + 1`.
    expect(evaluateGateMock).toHaveBeenCalledWith(
      expect.anything(),
      "program-1",
      1,
      5,
    );
  });

  it("commits a governed non-adjacent transition once an authorized user bypasses the ready gate", async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 5,
        rationale: RATIONALE,
        bypass_gate: true,
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    expect(advancePhaseMutationMock).toHaveBeenCalledTimes(1);
  });

  it("still refuses a non-adjacent transition no rule governs, with the same error", async () => {
    evaluateGateMock.mockResolvedValue(noRuleResult(1, 4));

    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 4, rationale: RATIONALE },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("non_adjacent_phase");
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("keeps the bypass exemption: an ungoverned jump reaches the gate verdict rather than the adjacency refusal", async () => {
    // Before this change the adjacency guard ran FIRST and `bypass_gate`
    // skipped it, so an ungoverned pair fell through to the evaluator and was
    // refused on its `no_rule` hard fail. That is still what happens — the
    // exemption has to stay, or bypass starts being answered by a guard it
    // was always allowed past.
    evaluateGateMock.mockResolvedValue(noRuleResult(1, 4));

    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        rationale: RATIONALE,
        bypass_gate: true,
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).not.toBe("non_adjacent_phase");
      expect(result.error).toBe("gate_blocked_hard");
    }
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("names the one-step alternative when it refuses an ungoverned jump", async () => {
    evaluateGateMock.mockResolvedValue(noRuleResult(1, 4));

    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 4, rationale: RATIONALE },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.recovery).toContain("1 → 2");
    }
  });

  it("leaves an adjacent transition's behaviour unchanged", async () => {
    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 2, rationale: RATIONALE },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("approval_required");
    expect(evaluateGateMock).toHaveBeenCalledWith(
      expect.anything(),
      "program-1",
      1,
      2,
    );
  });

  it("still blocks a governed non-adjacent transition whose hard criteria are unmet", async () => {
    evaluateGateMock.mockResolvedValue({
      pass: false,
      failedChecks: [
        {
          check: "fast_lane_decision_recorded",
          reason: "Move is not tagged with the straightforward complexity tier",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 5, rationale: RATIONALE },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("gate_blocked_hard");
      expect(result.recovery).toContain("fast_lane_decision_recorded");
    }
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range target before consulting the evaluator at all", async () => {
    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 9, rationale: RATIONALE },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("invalid_to_phase");
    expect(evaluateGateMock).not.toHaveBeenCalled();
  });
});

describe("advance_phase · the admitted case is a real declared transition", () => {
  it("is not hypothetical: the rule source governs a non-adjacent pair", () => {
    // Without this, the behavioural cases above would pin a guard against a
    // transition that production can never present.
    expect(findGateRule(1, 5)).toBeNull();
    expect(findGateRule(1, 5, { fastLaneEligible: true })).not.toBeNull();
    expect(
      findGateRule(1, 5, { fastLaneEligible: true })?.checks.map((c) => c.key),
    ).toEqual(["fast_lane_decision_recorded"]);
  });
});
