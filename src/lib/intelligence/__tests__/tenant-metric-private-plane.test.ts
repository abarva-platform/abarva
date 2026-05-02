import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildTenantMetricPersistenceRows,
  getAllTenantMetricObservations,
  getTenantMetricPrivatePlane,
  listTenantMetricPrivatePlanes,
  tenantMetricTableRef,
} from "@/lib/intelligence";
import { getPrivateDataPlaneResource } from "@/lib/knowledge/private-data-plane/registry";

describe("tenant metric private data plane", () => {
  it("uses a distinct private schema for each demo tenant with no shared public metric table", () => {
    const planes = listTenantMetricPrivatePlanes();
    const schemas = new Set(planes.map((plane) => plane.privateSchema));

    expect(planes.map((plane) => plane.tenantKey).sort()).toEqual([
      "apex-retail",
      "first-capital",
      "meridian-health",
    ]);
    expect(schemas.size).toBe(planes.length);
    expect([...schemas].every((schema) => schema !== "public")).toBe(true);
    expect([...schemas].every((schema) => schema.startsWith("client_"))).toBe(
      true,
    );
    expect(getPrivateDataPlaneResource("firstcapital")).toMatchObject({
      tenantKey: "first-capital",
      privateSchema: "client_first_capital_private",
      status: "db_only",
    });
  });

  it("builds schema-qualified table refs and rejects unsafe identifiers", () => {
    const plane = getTenantMetricPrivatePlane("apex-retail");
    expect(plane).not.toBeNull();
    expect(tenantMetricTableRef(plane!, "tenant_metric_observations")).toBe(
      '"client_apex_retail_private"."tenant_metric_observations"',
    );

    expect(() =>
      tenantMetricTableRef(
        { ...plane!, privateSchema: "public; drop table clients" },
        "tenant_metric_observations",
      ),
    ).toThrow("Unsafe SQL identifier");
  });

  it("builds persistence rows without cross-tenant reassignment", () => {
    const plane = getTenantMetricPrivatePlane("meridian-health");
    const observation = getAllTenantMetricObservations().find(
      (candidate) => candidate.tenantKey === "meridian-health",
    );

    const rows = buildTenantMetricPersistenceRows(
      {
        tenantKey: "meridian-health",
        clientId: "meridian-health-system",
        documentName: "Metric upload",
        fileName: "metrics.csv",
        observations: observation ? [observation] : [],
        sourcePayload: { test: true },
      },
      plane!,
      "batch-1",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      upload_batch_id: "batch-1",
      tenant_key: "meridian-health",
      client_id: "meridian-health-system",
      raw_payload: expect.objectContaining({
        test: true,
        sourceClientId: "meridian-health-system",
      }),
    });
  });

  it("migration creates per-client private tables and no common public observation table", () => {
    const migration = readFileSync(
      path.resolve(
        process.cwd(),
        "supabase/migrations/20260502165000_private_tenant_metric_observations.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("client_apex_retail_private");
    expect(migration).toContain("client_meridian_health_private");
    expect(migration).toContain("client_first_capital_private");
    expect(migration).toContain("tenant_metric_observations");
    expect(migration).not.toContain("public.tenant_metric_observations");
    expect(migration).not.toContain(
      "CREATE TABLE IF NOT EXISTS tenant_metric_observations",
    );
  });
});
