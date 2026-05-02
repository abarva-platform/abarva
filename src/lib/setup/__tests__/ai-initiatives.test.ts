import { readFileSync } from "node:fs";
import path from "node:path";
import {
  applySetupAiInitiativeFinancialFirewall,
  buildSetupAiInitiativePersistenceRows,
  getSetupAiInitiatives,
  getSetupAiInitiativesPrivatePlane,
  listSetupAiInitiativesPrivatePlanes,
  persistSetupAiInitiatives,
  setupAiInitiativesTableRef,
  summarizeSetupAiInitiatives,
} from "@/lib/setup";

describe("Setup AI Initiatives private plane", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("seeds five archetype-spanning initiatives per demo tenant", () => {
    for (const tenant of ["apex-retail", "meridian-health", "first-capital"]) {
      const records = getSetupAiInitiatives(tenant);
      const summary = summarizeSetupAiInitiatives(tenant, records);
      expect(records).toHaveLength(5);
      expect(summary.linkedPrograms).toBeGreaterThanOrEqual(2);
      expect(
        Object.values(summary.archetypeCounts).every((count) => count >= 1),
      ).toBe(true);
    }
  });

  it("uses distinct private schemas and rejects unsafe identifiers", () => {
    const planes = listSetupAiInitiativesPrivatePlanes();
    expect(planes.map((plane) => plane.tenantKey).sort()).toEqual([
      "apex-retail",
      "first-capital",
      "meridian-health",
    ]);
    expect(new Set(planes.map((plane) => plane.privateSchema)).size).toBe(3);
    expect(planes.every((plane) => plane.privateSchema !== "public")).toBe(
      true,
    );
    const plane = getSetupAiInitiativesPrivatePlane("apexretail");
    expect(setupAiInitiativesTableRef(plane!, "setup_ai_initiatives")).toBe(
      '"client_apex_retail_private"."setup_ai_initiatives"',
    );
    expect(() =>
      setupAiInitiativesTableRef(
        { ...plane!, privateSchema: "public;drop" },
        "setup_ai_initiatives",
      ),
    ).toThrow("Unsafe SQL identifier");
  });

  it("hides exact financial values unless explicitly visible", () => {
    const record = getSetupAiInitiatives("meridian-health")[0];
    expect(
      applySetupAiInitiativeFinancialFirewall(record).budgetAmount,
    ).toBeNull();
    expect(
      applySetupAiInitiativeFinancialFirewall(record, true).budgetAmount,
    ).toBe(record.budgetAmount);
    expect(
      applySetupAiInitiativeFinancialFirewall(record).directionalSummary.value,
    ).toContain("clinician");
  });

  it("does not create a common public setup initiative table", () => {
    const migration = readFileSync(
      path.resolve(
        process.cwd(),
        "supabase/migrations/20260502171000_private_setup_ai_initiatives.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("client_apex_retail_private");
    expect(migration).toContain("client_meridian_health_private");
    expect(migration).toContain("client_first_capital_private");
    expect(migration).toContain("setup_ai_initiatives");
    expect(migration).not.toContain("public.setup_ai_initiatives");
    expect(migration).not.toContain(
      "CREATE TABLE IF NOT EXISTS setup_ai_initiatives",
    );
  });

  it("skips safely without DATABASE_URL and never falls back to public persistence", async () => {
    delete process.env.DATABASE_URL;
    const records = getSetupAiInitiatives("apex-retail").slice(0, 1);
    const plane = getSetupAiInitiativesPrivatePlane("apex-retail");
    const rows = buildSetupAiInitiativePersistenceRows(
      {
        tenantKey: "apex-retail",
        clientId: "apex-retail",
        documentName: "demo",
        fileName: "demo.yml",
        initiatives: records,
      },
      plane!,
    );
    expect(rows[0]).toMatchObject({
      tenantKey: "apex-retail",
      clientId: "apex-retail",
    });
    await expect(
      persistSetupAiInitiatives({
        tenantKey: "apex-retail",
        clientId: "apex-retail",
        documentName: "demo",
        fileName: "demo.yml",
        initiatives: records,
      }),
    ).resolves.toMatchObject({
      status: "skipped_no_database_url",
      privateSchema: "client_apex_retail_private",
      acceptedCount: 1,
    });
    await expect(
      persistSetupAiInitiatives({
        tenantKey: "unknown",
        clientId: "unknown",
        documentName: "demo",
        fileName: "demo.yml",
        initiatives: [],
      }),
    ).resolves.toMatchObject({
      status: "skipped_no_private_plane",
      privateSchema: null,
    });
  });
});
