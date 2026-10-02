const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const loadPolicyMock = jest.fn();
const configMock = jest.fn();

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

import { GET } from "@/app/api/v1/source/[eventId]/nda/esign/status/route";

const eventId = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ eventId }) };

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "meridian-health", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  configMock.mockReturnValue({ state: "not_configured", fallback: "upload" });
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
    await expect(response.json()).resolves.toEqual({ available: true, fallback: "upload" });
    expect(configMock).toHaveBeenCalledWith("meridian-health");
    expect(loadPolicyMock).toHaveBeenCalledWith(expect.anything(), {
      activeClientKey: "meridian-health", sourceEventId: eventId,
    });
  });

  it("refuses cross-tenant and unauthorized requests before reading config", async () => {
    getActiveClientRowMock.mockResolvedValue({ key: "skyharbor-air" });
    expect((await GET(new Request("https://app.example.test"), context)).status).toBe(403);
    expect(configMock).not.toHaveBeenCalled();
    getActiveClientRowMock.mockResolvedValue({ key: "meridian-health" });
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });
    expect((await GET(new Request("https://app.example.test"), context)).status).toBe(403);
    expect(configMock).not.toHaveBeenCalled();
  });

  it("reports unavailable when not configured", async () => {
    const response = await GET(new Request("https://app.example.test"), context);
    await expect(response.json()).resolves.toEqual({ available: false, fallback: "upload" });
  });
});
