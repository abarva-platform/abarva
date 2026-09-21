import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockListPersistedSetupAiInitiatives = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: () =>
    Response.json({ error: "unauthenticated" }, { status: 401 }),
}));

jest.mock("@/lib/setup", () => {
  const actual = jest.requireActual("@/lib/setup") as typeof import("@/lib/setup");
  return {
    ...actual,
    listPersistedSetupAiInitiatives: (input: unknown) =>
      mockListPersistedSetupAiInitiatives(input),
  };
});

import { GET } from "../route";

describe("/api/setup/initiatives", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      clientId: "meridian-health",
      clientKey: "meridian-health",
      userId: "test-user",
      role: "admin",
    });
    mockListPersistedSetupAiInitiatives.mockResolvedValue({
      status: "skipped_no_database_url",
      tenantKey: "meridian-health",
      privateSchema: null,
      initiatives: [],
    });
  });
  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });
  it("returns tenant-scoped fixture fallback with financial firewall enabled by default", async () => {
    delete process.env.DATABASE_URL;
    const response = await GET(
      new NextRequest(
        "http://localhost/api/setup/initiatives?tenantKey=meridian-health",
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      tenantKey: "meridian-health",
      source: "fixture_fallback",
      summary: { total: 5, atRisk: 1 },
    });
    expect(
      body.initiatives.every(
        (item: { tenantKey: string }) => item.tenantKey === "meridian-health",
      ),
    ).toBe(true);
    expect(
      body.initiatives.every(
        (item: { budgetAmount: number | null; spendToDate: number | null }) =>
          item.budgetAmount === null && item.spendToDate === null,
      ),
    ).toBe(true);
  });
  it("filters status and archetype for the Tower feed contract", async () => {
    delete process.env.DATABASE_URL;
    mockRequireTenancy.mockResolvedValue({
      clientId: "apex-retail",
      clientKey: "apex-retail",
      userId: "test-user",
      role: "admin",
    });
    const response = await GET(
      new NextRequest(
        "http://localhost/api/setup/initiatives?tenantKey=apex-retail&status=at-risk&archetype=agent_rollout",
      ),
    );
    const body = await response.json();
    expect(body.initiatives).toHaveLength(1);
    expect(body.initiatives[0]).toMatchObject({
      initiativeId: "apex-aii-demand-agent",
      status: "at-risk",
      archetype: "agent_rollout",
    });
  });
  it("requires a tenant key", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/setup/initiatives"),
    );
    expect(response.status).toBe(400);
    expect(mockListPersistedSetupAiInitiatives).not.toHaveBeenCalled();
  });
  it("refuses an unauthenticated read before the data boundary", async () => {
    mockRequireTenancy.mockRejectedValue(new Error("unauthenticated"));

    const response = await GET(
      new NextRequest(
        "http://localhost/api/setup/initiatives?tenantKey=meridian-health",
      ),
    );

    expect(response.status).toBe(401);
    expect(mockListPersistedSetupAiInitiatives).not.toHaveBeenCalled();
  });
  it("refuses an opposite-tenant read before the data boundary", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/setup/initiatives?tenantKey=apex-retail",
      ),
    );

    expect(response.status).toBe(403);
    expect(mockListPersistedSetupAiInitiatives).not.toHaveBeenCalled();
  });
});
