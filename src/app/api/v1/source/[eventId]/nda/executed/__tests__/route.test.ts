const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const recordMock = jest.fn();
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
jest.mock("@/lib/source/nda/record-executed-nda", () => ({
  recordExecutedNda: (...args: unknown[]) => recordMock(...args),
}));
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST } from "../route";

const eventId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ eventId }) };

function request(): Request {
  const body = new FormData();
  body.set("vendorId", "VEN-001");
  body.set("artifactId", "22222222-2222-4222-8222-222222222222");
  body.set("templateVersion", "NDA-V1");
  body.set("effectiveFrom", "2026-09-30");
  body.set("executedAt", "2026-09-30T12:00:00Z");
  body.set("signatureMethod", "wet_ink");
  body.set("supplierSignatoryName", "Supplier signer");
  body.set("buyerSignatoryName", "Buyer signer");
  body.set("privateEvidenceRef", "private://evidence/nda-1");
  body.set("evidenceReference", "Reviewed signed pages and stored evidence reference.");
  body.set("clientKey", "foreign-tenant");
  body.set("recordedByUserId", "forged-user");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/nda/executed`, {
    method: "POST", body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "tenant-1", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "tenant-1" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named reviewer" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  recordMock.mockResolvedValue({ ok: true, id: "33333333-3333-4333-8333-333333333333" });
});

describe("executed NDA capture route", () => {
  it("binds tenant, event and named reviewer to the signed-in session", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(201);
    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "tenant-1", eventId, vendorId: "VEN-001",
      recordedByUserId: "person-1", scopeLevel: "event_only",
      coveredAffiliateEntityIds: [],
    }));
    expect(recordMock.mock.calls[0][0]).not.toHaveProperty("uploadedByUserId");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("refuses a user without Source stage authority", async () => {
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });
    const response = await POST(request(), params);
    expect(response.status).toBe(403);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it("requires a named linked reviewer and preserves writer refusal", async () => {
    getCurrentUserMock.mockResolvedValue({ personId: null, name: "Named reviewer" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(recordMock).not.toHaveBeenCalled();

    getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named reviewer" });
    recordMock.mockResolvedValue({ ok: false, code: "published_template_unavailable" });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "published_template_unavailable" });
  });
});
