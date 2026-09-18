/**
 * Behavioral test for the `moves-phase-gate-route` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * The catalog checker proves the control's tokens appear in executable code; it
 * cannot prove the code is reached. This drives the real route handler and
 * asserts the two things the control guarantees: a phase gate cannot be
 * advanced without an explicit human rationale, and advancing requires the
 * gate-approval capability rather than mere tenant membership.
 *
 * The refusals assert ordering as well as status. A rationale missing is caught
 * before the tenant lookup runs, so the route cannot be probed for which
 * program codes exist by sending requests with no rationale.
 */

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(async () => ({ userId: "user-1" })),
  clerkClient: jest.fn(async () => ({
    users: { getUser: jest.fn(async () => ({ id: "user-1" })) },
  })),
}));

jest.mock("@/lib/auth/tenant-access", () => ({
  tenantKeyForProgramCode: jest.fn(() => "tenant-a"),
  checkTenantAccessByKey: jest.fn(async () => ({ ok: true })),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    userId: "user-1",
    clientKey: "tenant-a",
    role: "client_admin",
  })),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: jest.fn(async () => ({ canApproveGates: true })),
}));

jest.mock("@/lib/auth/gate-approval-strict-mode", () => ({
  isGateApprovalStrictMode: jest.fn(() => false),
  isStrictModeApprovalRole: jest.fn(() => true),
}));

import { POST } from "../route";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { isGateApprovalStrictMode } from "@/lib/auth/gate-approval-strict-mode";

const mockCheckTenantAccess = jest.mocked(checkTenantAccessByKey);
const mockAccessPolicy = jest.mocked(loadUserProgramAccessPolicy);
const mockStrictMode = jest.mocked(isGateApprovalStrictMode);

const RATIONALE =
  "The sponsor confirmed the data readiness evidence and asked to advance the gate today.";

function gateRequest(body: Record<string, unknown>) {
  return POST(
    new Request("https://app.abarva.ai/api/programs/phase-gate", {
      method: "POST",
      body: JSON.stringify({
        programCode: "PRG-1",
        fromPhase: 2,
        toPhase: 3,
        ...body,
      }),
    }) as never,
  );
}

describe("phase-gate route · human approval gate", () => {
  beforeEach(() => {
    mockCheckTenantAccess.mockClear();
    mockCheckTenantAccess.mockResolvedValue({ ok: true } as never);
    mockAccessPolicy.mockClear();
    mockAccessPolicy.mockResolvedValue({ canApproveGates: true } as never);
    mockStrictMode.mockReturnValue(false);
  });

  it("refuses a gate advance with no human rationale, before any tenant lookup", async () => {
    const response = await gateRequest({});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "human_rationale_required",
    });
    // Ordering matters: an unauthenticated prober must not learn which
    // program codes resolve by sending requests with no rationale.
    expect(mockCheckTenantAccess).not.toHaveBeenCalled();
  });

  it("refuses a rationale that is present but empty of reasoning", async () => {
    const response = await gateRequest({ humanRationale: "ok" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "human_rationale_required",
    });
  });

  it("refuses a tenant member who does not hold gate-approval permission", async () => {
    mockAccessPolicy.mockResolvedValue({ canApproveGates: false } as never);

    const response = await gateRequest({ humanRationale: RATIONALE });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "forbidden" });
  });

  it("refuses an ordinary approver when strict mode demands an admin", async () => {
    mockStrictMode.mockReturnValue(true);
    jest
      .mocked(
        jest.requireMock("@/lib/auth/gate-approval-strict-mode")
          .isStrictModeApprovalRole as jest.Mock,
      )
      .mockReturnValue(false);

    const response = await gateRequest({ humanRationale: RATIONALE });

    expect(response.status).toBe(403);
  });

  it("refuses a caller whose tenant access does not check out", async () => {
    mockCheckTenantAccess.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    } as never);

    const response = await gateRequest({ humanRationale: RATIONALE });

    expect(response.status).toBe(403);
  });
});
