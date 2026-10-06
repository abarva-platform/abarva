const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const sendMock = jest.fn();
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
jest.mock("@/lib/source/esign/send-nda", () => ({
  sendSyntheticNdaForSignature: (...args: unknown[]) => sendMock(...args),
  readSyntheticNdaSigningAuthority: jest.fn(),
}));
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { POST } from "../route";

const eventId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ eventId }) };

function request(acknowledged = true, deliveryMode?: string): Request {
  const body = new FormData();
  body.set("vendorId", "SYN-VENDOR-001");
  body.set("contactAuthorityId", "SYN-CONTACT-001");
  body.set("templateVersion", "synthetic-1.0");
  if (acknowledged) body.set("acknowledged", "on");
  if (deliveryMode) body.set("deliveryMode", deliveryMode);
  body.set("clientKey", "forged-tenant");
  body.set("actorUserId", "forged-person");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/nda/esign/send`, {
    method: "POST", body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "meridian-health", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named operator" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  sendMock.mockResolvedValue({ ok: true, envelopeId: "33333333-3333-4333-8333-333333333333" });
});

describe("synthetic NDA send route", () => {
  it("binds tenant, event and actor to the signed-in session", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(201);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "meridian-health", eventId, actorUserId: "person-1",
      actorName: "Named operator", acknowledged: true,
    }), expect.anything());
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("blocks wrong tenant, missing permission and anonymous actor", async () => {
    getActiveClientRowMock.mockResolvedValueOnce({ key: "another-tenant" });
    expect((await POST(request(), params)).status).toBe(403);
    loadPolicyMock.mockResolvedValueOnce({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    getCurrentUserMock.mockResolvedValueOnce({ personId: null, name: "Named operator" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("refuses an unconfirmed external action", async () => {
    expect((await POST(request(false), params)).status).toBe(409);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("requires an explicit valid delivery choice for embedded signing", async () => {
    expect((await POST(request(true, "embedded"), params)).status).toBe(201);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ deliveryMode: "embedded" }), expect.anything());
    sendMock.mockClear();
    expect((await POST(request(true, "unknown"), params)).status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("preserves a not-ready refusal without refreshing the page", async () => {
    sendMock.mockResolvedValueOnce({ ok: false, code: "authority_not_ready" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
