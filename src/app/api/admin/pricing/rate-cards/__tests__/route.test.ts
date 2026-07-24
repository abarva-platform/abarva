import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockListRateCardVersions = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () => new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

jest.mock("@/lib/pricing/rate-card-repository", () => ({
  listRateCardVersions: (...args: unknown[]) => mockListRateCardVersions(...args),
}));

import { GET } from "../route";

function req(url: string) {
  return new NextRequest(url);
}

describe("GET /api/admin/pricing/rate-cards", () => {
  beforeEach(() => {
    mockRequireTenancy.mockReset();
    mockListRateCardVersions.mockReset();
  });

  it("401s when unauthenticated", async () => {
    mockRequireTenancy.mockRejectedValue(new Error("unauthenticated"));
    const response = await GET(req("http://localhost/api/admin/pricing/rate-cards"));
    expect(response.status).toBe(401);
  });

  it("lists global + client-scoped cards for the caller's own canonical tenant key", async () => {
    mockRequireTenancy.mockResolvedValue({ clientId: "c1", clientKey: "apexretail", userId: "user-1" });
    mockListRateCardVersions.mockImplementation(async (scopeType: string) =>
      scopeType === "global"
        ? [{ id: "g1", card_code: "GLOBAL-STARTER", version: 1, is_current: true, status: "approved", effective_from: null, effective_to: null, created_at: "2026-08-01T00:00:00.000Z" }]
        : [{ id: "c1v1", card_code: "ENTERPRISE", version: 1, is_current: true, status: "approved", effective_from: null, effective_to: null, created_at: "2026-08-01T00:00:00.000Z" }],
    );

    const response = await GET(req("http://localhost/api/admin/pricing/rate-cards"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.tenantKey).toBe("apex-retail"); // canonicalized from the apexretail app key
    expect(body.global).toHaveLength(1);
    expect(body.client).toHaveLength(1);
    expect(body.client[0]).toMatchObject({ cardCode: "ENTERPRISE", version: 1, isCurrent: true });

    // Confirms the client-scope call was actually scoped to this tenant, not left blank/wildcard.
    expect(mockListRateCardVersions).toHaveBeenCalledWith("client", "apex-retail", "ENTERPRISE");
  });
});
