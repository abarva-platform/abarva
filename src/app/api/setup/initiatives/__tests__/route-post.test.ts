import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockPersistSetupAiInitiatives = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: () =>
    Response.json({ error: "unauthenticated" }, { status: 401 }),
}));

jest.mock("@/lib/setup", () => {
  const actual = jest.requireActual("@/lib/setup") as typeof import("@/lib/setup");
  return {
    ...actual,
    persistSetupAiInitiatives: (input: unknown) =>
      mockPersistSetupAiInitiatives(input),
  };
});

import { POST } from "../route";

describe("POST /api/setup/initiatives", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      clientId: "meridian-health",
      clientKey: "meridian-health",
      userId: "test-user",
      role: "admin",
    });
    mockPersistSetupAiInitiatives.mockResolvedValue({
      status: "mocked_test_boundary",
      tenantKey: "meridian-health",
      privateSchema: "client_test_private",
      uploadBatchId: "mock-upload-batch",
      acceptedCount: 1,
      persistedInitiativeIds: ["upload-agent"],
    });
  });
  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("accepts CSV intake through a fully mocked persistence boundary", async () => {
    delete process.env.DATABASE_URL;
    const csv = [
      "initiative_id,name,archetype,status,owner_role,sponsor_role,started_at,vendor,target_outcome_name,target_value,unit,target_date",
      "upload-agent,Prior Auth Agent,agent_rollout,active,RCM Owner,CRCO,2026-05-01,ServiceNow,Clean packets,90,%,2026-12-31",
    ].join("\n");
    const formData = new FormData();
    formData.set("tenantKey", "meridian-health");
    formData.set("documentName", "AI Initiative upload");
    formData.set(
      "file",
      new File([csv], "ai-initiatives.csv", { type: "text/csv" }),
    );
    const response = await POST(
      new NextRequest("http://localhost/api/setup/initiatives", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      tenantKey: "meridian-health",
      acceptedCount: 1,
      rejectedCount: 0,
      acceptedInitiativeIds: ["upload-agent"],
      persistence: {
        status: "mocked_test_boundary",
        privateSchema: "client_test_private",
        acceptedCount: 1,
      },
    });
    expect(mockPersistSetupAiInitiatives).toHaveBeenCalledTimes(1);
    expect(mockPersistSetupAiInitiatives).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "meridian-health",
        clientId: "meridian-health",
        initiatives: [expect.objectContaining({ initiativeId: "upload-agent" })],
      }),
    );
  });

  it("rejects financial CSV columns without explicit financial visibility", async () => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "apex-retail",
      clientKey: "apex-retail",
      userId: "test-user",
      role: "admin",
    });
    const csv = [
      "initiative_id,name,archetype,status,owner_role,sponsor_role,started_at,vendor,budget_amount",
      "upload-copilot,Copilot,copilot_rollout,active,Owner,Sponsor,2026-05-01,Microsoft,1000",
    ].join("\n");
    const formData = new FormData();
    formData.set("tenantKey", "apex-retail");
    formData.set("documentName", "AI Initiative upload");
    formData.set(
      "file",
      new File([csv], "ai-initiatives.csv", { type: "text/csv" }),
    );
    const response = await POST(
      new NextRequest("http://localhost/api/setup/initiatives", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain(
      "Financial columns require financialVisibility=true",
    );
    expect(mockPersistSetupAiInitiatives).not.toHaveBeenCalled();
  });

  it("refuses an unauthenticated upload before persistence", async () => {
    mockRequireTenancy.mockRejectedValue(new Error("unauthenticated"));
    const formData = new FormData();
    formData.set("tenantKey", "meridian-health");
    formData.set("file", new File(["x"], "initiatives.csv", { type: "text/csv" }));

    const response = await POST(
      new NextRequest("http://localhost/api/setup/initiatives", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(401);
    expect(mockPersistSetupAiInitiatives).not.toHaveBeenCalled();
  });

  it("refuses an opposite-tenant upload before persistence", async () => {
    const csv = [
      "initiative_id,name,archetype,status,owner_role,sponsor_role,started_at",
      "cross-tenant,Blocked upload,agent_rollout,active,Owner,Sponsor,2026-05-01",
    ].join("\n");
    const formData = new FormData();
    formData.set("tenantKey", "apex-retail");
    formData.set(
      "file",
      new File([csv], "ai-initiatives.csv", { type: "text/csv" }),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/setup/initiatives", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(403);
    expect(mockPersistSetupAiInitiatives).not.toHaveBeenCalled();
  });
});
