import { NextRequest } from "next/server";
import { POST } from "../route";

describe("/api/admin/upload-dataset metric ingestion", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalSupabaseUrl === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    if (originalServiceKey === undefined)
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
    if (originalAnonKey === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  });

  it("parses KPI CSV uploads and reports private-plane persistence state", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const csv = [
      "metric_id,current_value,unit,as_of,source_detail,owner_role,program_id",
      "PAT-MET-003,61,%,2026-04-30,Apex forecast extract,SVP Supply Chain,apex-customer-inventory-ai-modernization",
    ].join("\n");
    const formData = new FormData();
    formData.set("clientId", "apex-retail-group");
    formData.set("documentName", "Reference metrics upload");
    formData.set(
      "file",
      new File([csv], "current-state-kpis.csv", { type: "text/csv" }),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/admin/upload-dataset", {
        method: "POST",
        body: formData,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metricIngestion).toMatchObject({
      tenantKey: "apex-retail",
      acceptedCount: 1,
      rejectedCount: 0,
      acceptedMetricIds: ["PAT-MET-003"],
      persistence: {
        status: "skipped_no_database_url",
        tenantKey: "apex-retail",
        privateSchema: "client_apex_retail_private",
        acceptedCount: 1,
      },
    });
  });
});
