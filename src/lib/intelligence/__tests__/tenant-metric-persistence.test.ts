import {
  getAllTenantMetricObservations,
  getTenantMetricPrivatePlane,
  persistTenantMetricObservations,
} from "@/lib/intelligence";

describe("tenant metric persistence behavior", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("skips safely when DATABASE_URL is unavailable instead of pretending rows were loaded", async () => {
    delete process.env.DATABASE_URL;
    const observation = getAllTenantMetricObservations().find(
      (candidate) => candidate.tenantKey === "apex-retail",
    );

    const result = await persistTenantMetricObservations({
      tenantKey: "apex-retail",
      clientId: "apex-retail-group",
      documentName: "metrics.csv",
      fileName: "metrics.csv",
      observations: observation ? [observation] : [],
    });

    expect(result).toMatchObject({
      status: "skipped_no_database_url",
      tenantKey: "apex-retail",
      privateSchema: getTenantMetricPrivatePlane("apex-retail")?.privateSchema,
      acceptedCount: 1,
      persistedObservationIds: [],
    });
  });

  it("skips unknown tenants rather than falling back to a shared table", async () => {
    const result = await persistTenantMetricObservations({
      tenantKey: "unknown-client",
      clientId: "unknown-client",
      documentName: "metrics.csv",
      fileName: "metrics.csv",
      observations: [],
    });

    expect(result).toMatchObject({
      status: "skipped_no_private_plane",
      privateSchema: null,
      uploadBatchId: null,
    });
  });
});
