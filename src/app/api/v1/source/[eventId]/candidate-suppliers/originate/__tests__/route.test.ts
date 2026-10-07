const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const originateMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () => Response.json({ error: "forbidden" }, { status: 403 }),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));
jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => loadPolicyMock(...args),
}));
jest.mock("@/lib/source/candidate-suppliers/originate-prospective-supplier", () => ({
  originateProspectiveSupplier: (...args: unknown[]) => originateMock(...args),
}));
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST } from "../route";

const eventId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ eventId }) };

function request(accept?: string) {
  const body = new FormData();
  body.set("eventVersionId", "22222222-2222-4222-8222-222222222222");
  body.set("legalName", "Northwind Services LLC");
  body.set("contactName", "Test Contact");
  body.set("contactEmail", "test-contact@example.test");
  body.set("contactPermissionConfirmed", "on");
  body.set("rationale", "Add this prospective supplier to the event panel.");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/candidate-suppliers/originate`, {
    method: "POST",
    body,
    headers: accept ? { Accept: accept } : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "tenant-alpha", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "tenant-alpha" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named Reviewer" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  originateMock.mockResolvedValue({ ok: true, supplierId: "prospect:1", authorityId: "authority-1" });
});

describe("prospective supplier origination route", () => {
  it("uses server-side tenant and reviewer identity, then returns to the event", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`/source/new/${eventId}`);
    expect(originateMock).toHaveBeenCalledWith({
      clientKey: "tenant-alpha",
      eventId,
      expectedEventVersionId: "22222222-2222-4222-8222-222222222222",
      legalName: "Northwind Services LLC",
      contactName: "Test Contact",
      contactEmail: "test-contact@example.test",
      contactPermissionConfirmed: true,
      approvedByUserId: "person-1",
      approvedByName: "Named Reviewer",
      rationale: "Add this prospective supplier to the event panel.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("blocks a mismatched tenant and users without approval authority", async () => {
    getActiveClientRowMock.mockResolvedValueOnce({ key: "tenant-beta" });
    expect((await POST(request(), params)).status).toBe(403);
    loadPolicyMock.mockResolvedValueOnce({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    expect(originateMock).not.toHaveBeenCalled();
  });

  it("refuses an unnamed actor before the writer runs", async () => {
    getCurrentUserMock.mockResolvedValue({ personId: null, name: "Named Reviewer" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(originateMock).not.toHaveBeenCalled();
  });

  it("returns a JSON result for the in-place operator form", async () => {
    const response = await POST(request("application/json"), params);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      ok: true,
      supplierId: "prospect:1",
      authorityId: "authority-1",
    });
  });
});
