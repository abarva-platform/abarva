import { NextRequest } from "next/server";
import { POST } from "../route";

describe("POST /api/setup/initiatives", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("accepts CSV intake and reports private-plane persistence status", async () => {
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
        status: "skipped_no_database_url",
        privateSchema: "client_meridian_health_private",
        acceptedCount: 1,
      },
    });
  });

  it("rejects financial CSV columns without explicit financial visibility", async () => {
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
  });
});
