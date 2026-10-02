/**
 * Behavioral test for the `moves-phase-advance-route` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * The catalog checker proves the control's tokens appear in executable code; it
 * cannot prove the code is reached. This drives the real route handler and
 * asserts the guarantee: a program phase cannot advance without an explicit
 * human rationale, requires an explicit approval action, and never creates an
 * alternate sponsor approval request.
 *
 * Each refusal asserts the `advancePhase` mutation was never called. The proof
 * is the write that did not happen, not the message that came back.
 */

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: jest.fn(async () => ({ id: "program-1", currentPhase: 1 })),
}));

jest.mock("@/lib/programs/mutations", () => ({
  advancePhase: jest.fn(async () => ({
    ok: true,
    program: { id: "program-1" },
  })),
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: jest.fn(async () => ({
    pass: true,
    failedChecks: [],
    requiresApproval: false,
    approverRole: "approver",
  })),
  requestFounderApproval: jest.fn(async () => "approval-1"),
  consumeApproval: jest.fn(async () => ({ ok: true })),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    clientKey: "tenant-a",
    clientId: "tenant-a",
    role: "client_admin",
  })),
  tenancyErrorResponse: jest.fn((error: unknown) =>
    Response.json(
      {
        error: "tenancy",
        why: error instanceof Error ? error.message : String(error),
      },
      { status: 401 },
    ),
  ),
  TenancyError: class TenancyError extends Error {
    code = "unauthenticated";
  },
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: jest.fn(async () => ({
    canApproveGates: true,
    programIdsAllowed: null,
  })),
}));

jest.mock("@/lib/programs/phase-gate-actor", () => ({
  resolvePhaseGateActorPersonId: jest.fn(async () => ({
    ok: true,
    personId: "person-1",
  })),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: jest.fn(async () => ({})),
}));

import { POST } from "../route";
import { advancePhase } from "@/lib/programs/mutations";
import {
  evaluateGate,
  requestFounderApproval,
} from "@/lib/programs/governance";

const mockAdvancePhase = jest.mocked(advancePhase);
const mockEvaluateGate = jest.mocked(evaluateGate);
const mockRequestApproval = jest.mocked(requestFounderApproval);

type GateShape = Awaited<ReturnType<typeof evaluateGate>>;

function gate(overrides: Partial<GateShape> = {}): GateShape {
  return {
    pass: true,
    failedChecks: [],
    requiresApproval: false,
    approverRole: "approver",
    ...overrides,
  } as GateShape;
}

const RATIONALE =
  "The authorized workspace user reviewed the privacy attestation and approved moving to the next phase.";

function advanceRequest(body: Record<string, unknown>) {
  return POST(
    new Request("https://app.abarva.ai/api/v1/programs/program-1/advance", {
      method: "POST",
      body: JSON.stringify(body),
    }) as never,
    { params: Promise.resolve({ programId: "program-1" }) } as never,
  );
}

describe("program advance route · human approval gate", () => {
  beforeEach(() => {
    mockAdvancePhase.mockClear();
    mockRequestApproval.mockClear();
    mockEvaluateGate.mockClear();
    mockEvaluateGate.mockResolvedValue(gate());
  });

  it("refuses to advance without a human rationale, and writes nothing", async () => {
    const response = await advanceRequest({ toPhase: 2 });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "human_rationale_required",
    });
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("requires explicit approval and does not queue a sponsor approval request", async () => {
    mockEvaluateGate.mockResolvedValue(gate({ requiresApproval: true }));

    const response = await advanceRequest({
      toPhase: 2,
      humanRationale: RATIONALE,
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "explicit_approval_required",
    });
    expect(mockRequestApproval).not.toHaveBeenCalled();
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });

  it("advances only after the authorized workspace user explicitly approves", async () => {
    const response = await advanceRequest({
      toPhase: 2,
      humanRationale: RATIONALE,
      selfApproveIfAuthorized: true,
    });

    expect(response.status).toBe(200);
    expect(mockAdvancePhase).toHaveBeenCalledTimes(1);
    expect(mockRequestApproval).not.toHaveBeenCalled();
  });

  it("refuses an unmet hard gate, and writes nothing", async () => {
    mockEvaluateGate.mockResolvedValue(
      gate({
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

    const response = await advanceRequest({
      toPhase: 2,
      humanRationale: RATIONALE,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mockAdvancePhase).not.toHaveBeenCalled();
  });
});
