const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const approveMock = jest.fn();
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
jest.mock("@/lib/source/rfx-delivery/write-contact-approval", () => ({
  approveRfxContact: (...args: unknown[]) => approveMock(...args),
}));
jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePathMock(...args) }));

import { POST } from "@/app/api/v1/source/[eventId]/rfx-release/contacts/approve/route";

const eventId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ eventId }) };

function request(): Request {
  const body = new FormData();
  body.set("vendorId", "VEN-001");
  body.set("contactId", "CONTACT-001");
  body.set("evidenceReference", "Reviewed named contact and invitation scope.");
  body.set("clientKey", "foreign-tenant");
  body.set("approvedByUserId", "forged-reviewer");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/rfx-release/contacts/approve`, {
    method: "POST", body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "tenant-alpha", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "tenant-alpha" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named reviewer" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  approveMock.mockResolvedValue({ ok: true, id: "row-1", authorityId: "approval-1" });
});

describe("named RFx contact approval route", () => {
  it("binds tenant, event and approver to the signed-in session", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(201);
    expect(approveMock).toHaveBeenCalledWith({
      clientKey: "tenant-alpha", eventId, vendorId: "VEN-001", contactId: "CONTACT-001",
      approvedByUserId: "person-1",
      evidenceReference: "Reviewed named contact and invitation scope.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("refuses an unauthorised or unnamed reviewer without writing", async () => {
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    expect(approveMock).not.toHaveBeenCalled();

    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
    getCurrentUserMock.mockResolvedValue({ personId: null, name: "Named reviewer" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(approveMock).not.toHaveBeenCalled();
  });

  it("keeps a missing accepted candidate or contact as a refusal", async () => {
    approveMock.mockResolvedValue({ ok: false, code: "candidate_not_accepted" });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "candidate_not_accepted" });
  });
});
