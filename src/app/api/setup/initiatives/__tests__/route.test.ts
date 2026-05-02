import { NextRequest } from "next/server";
import { GET } from "../route";

describe("/api/setup/initiatives", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
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
  });
});
