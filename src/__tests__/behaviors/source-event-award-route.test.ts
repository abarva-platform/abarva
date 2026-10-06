const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const awardMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () => Response.json({ error: "forbidden" }, { status: 403 }),
}));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: () => getActiveClientRowMock() }));
jest.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUserMock() }));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => loadPolicyMock(...args),
}));
jest.mock("@/lib/source/award/write-award-decision", () => ({
  recordSourceEventAward: (...args: unknown[]) => awardMock(...args),
}));
jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePathMock(...args) }));

import { POST } from "@/app/api/v1/source/[eventId]/award/route";

const eventId = "22222222-2222-4222-8222-222222222222";
const params = { params: Promise.resolve({ eventId }) };

function request(): Request {
  const body = new FormData();
  body.set("vendorId", "VEN-001");
  body.set("contractName", "Managed network services");
  body.set("awardRationale", "Lowest evaluated cost with the required service credits.");
  body.set("evidenceReference", "Evaluation summary accepted by the decision owner.");
  // Submitted values that must never be believed.
  body.set("clientKey", "foreign-tenant");
  body.set("approvedByUserId", "forged-approver");
  body.set("approvedByName", "Forged Approver");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/award`, {
    method: "POST",
    body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "tenant-alpha", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "tenant-alpha" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named approver" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  awardMock.mockResolvedValue({ ok: true, awardId: "award-1", contractId: "AWD-ABCDEF012345" });
});

describe("the Source event award route", () => {
  it("takes the approver from the session and never from the form", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(201);
    expect(awardMock).toHaveBeenCalledWith({
      clientKey: "tenant-alpha",
      eventId,
      vendorId: "VEN-001",
      approvedByUserId: "person-1",
      approvedByName: "Named approver",
      contractName: "Managed network services",
      awardRationale: "Lowest evaluated cost with the required service credits.",
      evidenceReference: "Evaluation summary accepted by the decision owner.",
      currency: undefined,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("returns the contract the award produced", async () => {
    const response = await POST(request(), params);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      awardId: "award-1",
      contractId: "AWD-ABCDEF012345",
    });
  });

  it("refuses an unauthorised approver without awarding", async () => {
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    expect(awardMock).not.toHaveBeenCalled();
  });

  it("refuses a session whose active tenant is not the one it is signed in to", async () => {
    getActiveClientRowMock.mockResolvedValue({ key: "tenant-beta" });
    expect((await POST(request(), params)).status).toBe(403);
    expect(awardMock).not.toHaveBeenCalled();
  });

  it("refuses an unnamed approver without awarding", async () => {
    getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "   " });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "approver_identity_required" });
    expect(awardMock).not.toHaveBeenCalled();

    getCurrentUserMock.mockResolvedValue({ personId: null, name: "Named approver" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(awardMock).not.toHaveBeenCalled();
  });

  it("passes the writer's refusals through rather than reporting a success", async () => {
    awardMock.mockResolvedValue({
      ok: false,
      code: "award_not_derivable",
      refusals: ["The winning supplier has no resolved canonical identity"],
    });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "award_not_derivable",
      refusals: ["The winning supplier has no resolved canonical identity"],
    });
  });

  it("separates an unreachable data plane from a refused award", async () => {
    awardMock.mockResolvedValue({ ok: false, code: "award_unavailable" });
    expect((await POST(request(), params)).status).toBe(503);

    awardMock.mockResolvedValue({ ok: false, code: "duplicate_award" });
    expect((await POST(request(), params)).status).toBe(409);
  });
});
