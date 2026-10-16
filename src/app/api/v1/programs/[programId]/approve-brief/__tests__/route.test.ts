/**
 * The P0 brief approval finds the Move's pending request by program id and then
 * checks the row's tenant against the caller's. Rows for one tenant are stored
 * under more than one spelling of its key, so that check must accept the whole
 * per-tenant alias set: a request stored under the canonical spelling is this
 * tenant's and must be decided; a request under another tenant's spelling is
 * still refused. A check on one spelling reported "no pending brief approval"
 * for a request that existed, and P0 could not be crossed.
 */
const tenancy = {
  clientId: "client-1",
  clientKey: "meridian",
  userId: "approver-1",
  email: "approver@example.test",
  role: "maestro",
};
let canApproveGates = true;
let pendingRows: Array<{ id: string; tenant_key: string }> = [];
const selectMock = jest.fn(async (request: unknown) => {
  void request;
  return pendingRows;
});
const decideMock = jest.fn(async (input: Record<string, unknown>) => {
  void input;
  return { id: "req-1" };
});

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: jest.fn(async () => ({ canApproveGates })),
}));
jest.mock("@/lib/programs/approval", () => ({
  decideApprovalRequest: (input: Record<string, unknown>) => decideMock(input),
}));
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { select: (request: unknown) => selectMock(request) },
}));

import { POST } from "../route";

function call(programId = "move-1") {
  const req = { json: jest.fn(async () => ({ rationale: "Approved." })) } as never;
  return POST(req, { params: Promise.resolve({ programId }) });
}

beforeEach(() => {
  jest.clearAllMocks();
  canApproveGates = true;
  pendingRows = [];
});

describe("POST /api/v1/programs/:programId/approve-brief — whose request this is", () => {
  it("decides a pending request stored under the canonical spelling of the caller's tenant", async () => {
    pendingRows = [{ id: "req-canonical", tenant_key: "meridian-health" }];

    const res = await call();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, requestId: "req-canonical" });
    expect(decideMock).toHaveBeenCalledTimes(1);
    expect(decideMock.mock.calls[0]?.[0]).toMatchObject({
      requestId: "req-canonical",
      decision: "approved",
    });
  });

  it("decides a pending request stored under the app spelling of the caller's tenant", async () => {
    pendingRows = [{ id: "req-app", tenant_key: "meridian" }];

    const res = await call();

    expect(res.status).toBe(200);
    expect(decideMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a pending request that belongs to another tenant, and decides nothing", async () => {
    pendingRows = [{ id: "req-other", tenant_key: "apex-retail" }];

    const res = await call();

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: "no_pending_request" });
    expect(decideMock).not.toHaveBeenCalled();
  });

  it("reports no pending request when none exists", async () => {
    const res = await call();

    expect(res.status).toBe(404);
    expect(decideMock).not.toHaveBeenCalled();
  });

  it("looks the request up by Move and pending status, then settles tenancy on the row", async () => {
    pendingRows = [{ id: "req-canonical", tenant_key: "meridian-health" }];

    await call("move-9");

    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "program_approval_requests",
        where: { program_id: "move-9", request_status: "pending" },
      }),
    );
  });
});
