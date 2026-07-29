const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn();
const loadUserProgramAccessPolicyMock = jest.fn();
const seedDemoDataMock = jest.fn();
const removeDemoDataMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  tenancyErrorResponse: (...args: unknown[]) =>
    tenancyErrorResponseMock(...args),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

jest.mock("@/scripts/demo-data/generate", () => ({
  seedDemoData: (...args: unknown[]) => seedDemoDataMock(...args),
  removeDemoData: (...args: unknown[]) => removeDemoDataMock(...args),
}));

function jsonRequest(body: unknown): import("next/server").NextRequest {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

function urlRequest(url: string): import("next/server").NextRequest {
  return { url } as unknown as import("next/server").NextRequest;
}

describe("/api/tower/seed-demo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadUserProgramAccessPolicyMock.mockResolvedValue({
      accessLevel: "client_admin",
    });
  });

  it("blocks demo seeding for governed foundation tenants before role or write lookup", async () => {
    requireTenancyMock.mockResolvedValue({
      clientId: "client-airline",
      clientKey: "airline-demo-new",
      userId: "user-1",
    });

    const { POST } = await import("../seed-demo/route");
    const response = await POST(
      jsonRequest({
        clientId: "client-airline",
        industry: "DIVERSIFIED",
        orgSize: "enterprise",
        aiMaturity: "scaling",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "governed_foundation_tenant",
    });
    expect(loadUserProgramAccessPolicyMock).not.toHaveBeenCalled();
    expect(seedDemoDataMock).not.toHaveBeenCalled();
  });

  it("blocks demo reset for governed foundation tenants before role or delete lookup", async () => {
    requireTenancyMock.mockResolvedValue({
      clientId: "client-airline",
      clientKey: "airline-demo-new",
      userId: "user-1",
    });

    const { DELETE } = await import("../seed-demo/route");
    const response = await DELETE(
      urlRequest("https://app.abarva.ai/api/tower/seed-demo?clientId=client-airline"),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "governed_foundation_tenant",
    });
    expect(loadUserProgramAccessPolicyMock).not.toHaveBeenCalled();
    expect(removeDemoDataMock).not.toHaveBeenCalled();
  });
});

export {};
