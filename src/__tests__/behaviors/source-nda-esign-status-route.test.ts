const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const loadPolicyMock = jest.fn();
const configMock = jest.fn();
const operatorStatusMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () => Response.json({ error: "forbidden" }, { status: 403 }),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => loadPolicyMock(...args),
}));
jest.mock("@/lib/source/esign/config", () => ({
  resolveSourceNdaEsignConfig: (...args: unknown[]) => configMock(...args),
}));
jest.mock("@/lib/source/esign/operator-status", () => ({
  readSyntheticNdaOperatorStatus: (...args: unknown[]) => operatorStatusMock(...args),
}));

import { GET } from "@/app/api/v1/source/[eventId]/nda/esign/status/route";

const eventId = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ eventId }) };

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "meridian-health", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  configMock.mockReturnValue({ state: "not_configured", fallback: "upload" });
  operatorStatusMock.mockResolvedValue([]);
});

describe("Source NDA e-signature capability route", () => {
  it("keeps upload fallback and never exposes configuration identifiers", async () => {
    configMock.mockReturnValue({
      state: "configured", provider: "docusign", environment: "demo",
      accountId: "private-account", integrationKey: "integration-1", userId: "user-1",
      keyId: "https://kv-abarva-lab-001.vault.azure.net/keys/source-nda-docusign-lab-jwt/version-1",
      testInbox: "tester@example.test",
    });
    const response = await GET(new Request("https://app.example.test"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ available: true, fallback: "upload", suppliers: [] });
    expect(configMock).toHaveBeenCalledWith("meridian-health");
    expect(loadPolicyMock).toHaveBeenCalledWith(expect.anything(), {
      activeClientKey: "meridian-health", sourceEventId: eventId,
    });
    expect(operatorStatusMock).toHaveBeenCalledWith({ clientKey: "meridian-health", eventId });
  });

  it("refuses cross-tenant and unauthorized requests before reading config", async () => {
    getActiveClientRowMock.mockResolvedValue({ key: "skyharbor-air" });
    expect((await GET(new Request("https://app.example.test"), context)).status).toBe(403);
    expect(configMock).not.toHaveBeenCalled();
    expect(operatorStatusMock).not.toHaveBeenCalled();
    getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });
    expect((await GET(new Request("https://app.example.test"), context)).status).toBe(403);
    expect(configMock).not.toHaveBeenCalled();
  });

  it("reports unavailable when not configured", async () => {
    const response = await GET(new Request("https://app.example.test"), context);
    await expect(response.json()).resolves.toEqual({ available: false, fallback: "upload", suppliers: [] });
  });

  it("returns contact and envelope status but no configuration identifiers", async () => {
    operatorStatusMock.mockResolvedValueOnce([{
      vendorId: "SYN-VENDOR-001", contactAuthorityId: "SYN-CONTACT-001",
      contactName: "Fictional Contact", envelopeId: "33333333-3333-4333-8333-333333333333",
      envelopeStatus: "sent", envelopeTemplateVersion: "synthetic-1.0",
    }]);
    const response = await GET(new Request("https://app.example.test"), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ available: false, fallback: "upload", suppliers: [{
      vendorId: "SYN-VENDOR-001", contactAuthorityId: "SYN-CONTACT-001",
      contactName: "Fictional Contact", envelopeId: "33333333-3333-4333-8333-333333333333",
      envelopeStatus: "sent", envelopeTemplateVersion: "synthetic-1.0",
    }] });
  });

  it("fails closed when the governed status cannot be read", async () => {
    operatorStatusMock.mockResolvedValueOnce(null);
    const response = await GET(new Request("https://app.example.test"), context);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "authority_unavailable" });
  });
});
