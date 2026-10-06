const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const linkMock = jest.fn();

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
jest.mock("@/lib/source/esign/embedded-link", () => ({
  createSyntheticNdaEmbeddedLink: (...args: unknown[]) => linkMock(...args),
  readSyntheticNdaEmbeddedEnvelope: jest.fn(),
}));
jest.mock("@/lib/source/esign/send-nda", () => ({
  readSyntheticNdaSigningAuthority: jest.fn(),
}));

import { POST } from "../route";

const eventId = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ eventId }) };

function request(acknowledged = true, role = "supplier"): Request {
  const body = new FormData();
  body.set("envelopeId", "33333333-3333-4333-8333-333333333333");
  body.set("vendorId", "SYN-VENDOR-001");
  body.set("contactAuthorityId", "SYN-CONTACT-001");
  body.set("templateVersion", "synthetic-1.0");
  body.set("role", role);
  if (acknowledged) body.set("acknowledged", "on");
  body.set("clientKey", "forged-tenant");
  body.set("actorUserId", "forged-person");
  return new Request(`https://app.example.test/api/v1/source/${eventId}/nda/esign/link`, {
    method: "POST", body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "meridian-health", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named test operator" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  linkMock.mockResolvedValue({ ok: true, url: "https://demo.docusign.net/signing/one" });
});

describe("synthetic NDA embedded link route", () => {
  it("uses only signed-in tenant, actor and event, never body identity", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true, url: "https://demo.docusign.net/signing/one" });
    expect(linkMock).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "meridian-health", eventId, actorUserId: "person-1",
      actorName: "Named test operator", role: "supplier",
    }), expect.anything());
  });

  it("refuses a different tenant, insufficient permission and missing actor", async () => {
    getActiveClientRowMock.mockResolvedValueOnce({ key: "other-tenant" });
    expect((await POST(request(), params)).status).toBe(403);
    loadPolicyMock.mockResolvedValueOnce({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    getCurrentUserMock.mockResolvedValueOnce({ personId: null, name: "Named test operator" });
    expect((await POST(request(), params)).status).toBe(409);
    expect(linkMock).not.toHaveBeenCalled();
  });

  it("requires deliberate action and a valid signer role", async () => {
    expect((await POST(request(false), params)).status).toBe(409);
    expect((await POST(request(true, "observer"), params)).status).toBe(400);
    expect(linkMock).not.toHaveBeenCalled();
  });

  it("does not expose a link for an email or stale envelope", async () => {
    linkMock.mockResolvedValueOnce({ ok: false, code: "signing_link_unavailable" });
    const response = await POST(request(), params);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "signing_link_unavailable" });
  });
});
