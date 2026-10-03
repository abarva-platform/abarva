const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const publishMock = jest.fn();
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
jest.mock("@/lib/source/nda/publish-synthetic-template", () => ({
  publishSyntheticTemplate: (...args: unknown[]) => publishMock(...args),
}));
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST } from "../route";

const eventId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ eventId }) };

function request(): Request {
  const body = new FormData();
  body.set("artifactId", "22222222-2222-4222-8222-222222222222");
  body.set("templateVersion", "SYN-NDA-1.0");
  body.set("displayName", "Synthetic mutual NDA");
  body.set("rationale", "I approve this synthetic test template only.");
  body.set("acknowledged", "on");
  body.set("actorUserId", "forged-person");
  body.set("clientKey", "foreign-tenant");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/nda/templates/publish`, {
    method: "POST", body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "meridian-health", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named admin" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  publishMock.mockResolvedValue({ ok: true, id: "33333333-3333-4333-8333-333333333333" });
});

describe("synthetic NDA template publication route", () => {
  it("binds event, tenant and named actor to the signed-in session", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(201);
    expect(publishMock).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "meridian-health", eventId, actorUserId: "person-1",
      actorName: "Named admin", acknowledged: true,
    }));
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("rejects mismatched tenant, missing stage authority, and anonymous actor", async () => {
    getActiveClientRowMock.mockResolvedValueOnce({ key: "other-tenant" });
    expect((await POST(request(), params)).status).toBe(403);
    requireTenancyMock.mockResolvedValueOnce({ clientKey: "other-tenant", userId: "person-1" });
    getActiveClientRowMock.mockResolvedValueOnce({ key: "other-tenant" });
    expect((await POST(request(), params)).status).toBe(403);
    loadPolicyMock.mockResolvedValueOnce({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    getCurrentUserMock.mockResolvedValueOnce({ personId: null, name: "Named admin" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it("preserves writer refusal and does not refresh", async () => {
    publishMock.mockResolvedValue({ ok: false, code: "template_bytes_mismatch" });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
