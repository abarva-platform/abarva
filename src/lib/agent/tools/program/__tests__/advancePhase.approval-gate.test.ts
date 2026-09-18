/**
 * Behavioral test for the `moves-agent-phase-advance-tool` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * The catalog checker proves the control's tokens appear in executable code. It
 * cannot prove the code is reached. This executes the real tool handler and
 * asserts the two things the control exists to guarantee:
 *
 *   1. an agent cannot advance a phase without an explicit human rationale, and
 *   2. an agent never satisfies a gate approval — when one is required it
 *      queues a request and refuses.
 *
 * Both assertions are about the mutation: the proof is that `advancePhase` was
 * never called, not that a particular string came back.
 */

jest.mock("../../registry", () => ({
  registerTool: jest.fn(),
}));

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    clientKey: "tenant-a",
    clientId: "tenant-a",
    role: "client_admin",
  })),
  TenancyError: class TenancyError extends Error {
    code = "unauthenticated";
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: jest.fn(async () => ({ id: "program-1", currentPhase: 1 })),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: jest.fn(async () => ({ canApproveGates: false })),
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase: jest.fn(async () => ({ ok: true })),
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: jest.fn(async () => ({
    pass: true,
    failedChecks: [],
    requiresApproval: false,
    approverRole: "sponsor",
  })),
  requestFounderApproval: jest.fn(async () => undefined),
}));

import { advancePhaseTool } from "../advancePhase";
import { advancePhase } from "@/lib/programs/mutations";
import { evaluateGate, requestFounderApproval } from "@/lib/programs/governance";
import { getProgramById } from "@/lib/programs/queries";

const mockAdvancePhase = jest.mocked(advancePhase);
const mockEvaluateGate = jest.mocked(evaluateGate);
const mockRequestFounderApproval = jest.mocked(requestFounderApproval);
const mockGetProgramById = jest.mocked(getProgramById);

const ctx = {
  accessPolicy: { canApproveGates: false },
} as unknown as Parameters<typeof advancePhaseTool.handler>[1];

type GateCheckShape = Awaited<ReturnType<typeof evaluateGate>>;

function gateCheck(overrides: Partial<GateCheckShape> = {}): GateCheckShape {
  return {
    pass: true,
    failedChecks: [],
    requiresApproval: false,
    approverRole: "sponsor",
    ...overrides,
  } as GateCheckShape;
}

describe("advance_phase tool · human approval gate", () => {
  beforeEach(() => {
    mockAdvancePhase.mockClear();
    mockRequestFounderApproval.mockClear();
    mockEvaluateGate.mockClear();
    mockGetProgramById.mockResolvedValue({
      id: "program-1",
      currentPhase: 1,
    } as never);
    mockEvaluateGate.mockResolvedValue(gateCheck());
  });

  it("refuses to advance without an explicit human rationale, and writes nothing", async () => {
    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 2 },
      ctx,
    );

    expect(result).toMatchObject({ success: false, error: "human_rationale_required" });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("queues an approval request instead of satisfying the gate itself", async () => {
    mockEvaluateGate.mockResolvedValue(gateCheck({ requiresApproval: true }));

    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 2,
        rationale:
          "The sponsor confirmed the privacy attestation is complete and asked to move on.",
      },
      ctx,
    );

    expect(result).toMatchObject({ success: false, error: "approval_required" });
    // The whole point of the control: a pending request, never an advance.
    expect(mockRequestFounderApproval).toHaveBeenCalledTimes(1);
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("refuses a bypass from a session without gate-approval rights", async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: "program-1",
        to_phase: 4,
        bypass_gate: true,
        rationale:
          "Sponsor asked to skip ahead to the execution roadmap for the board review.",
      },
      ctx,
    );

    expect(result).toMatchObject({ success: false, error: "approval_permission_required" });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("still blocks on an unmet hard gate before any rationale question arises", async () => {
    mockEvaluateGate.mockResolvedValue(
      gateCheck({
        pass: false,
        failedChecks: [
          {
            check: "privacy_attestation",
            reason: "not recorded",
            severity: "hard",
          },
        ],
      }),
    );

    const result = await advancePhaseTool.handler(
      { program_id: "program-1", to_phase: 2, rationale: "Ready to move." },
      ctx,
    );

    expect(result).toMatchObject({ success: false, error: "gate_blocked_hard" });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });
});
