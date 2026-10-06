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

  it("maps the legacy Arcturus app key to the First Capital setup initiative registry", () => {
    const records = getSetupAiInitiatives("arcturus");
    const summary = summarizeSetupAiInitiatives("arcturus", records);

    expect(records).toHaveLength(5);
    expect(records.every((record) => record.tenantKey === "first-capital")).toBe(
      true,
    );
    expect(summary.tenantKey).toBe("first-capital");
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

  // Behavioural, not a byte read of one fixed 2026-05 migration file: that scan
  // could not fail from any later change to the code that actually writes. This
  // drives the real persist and read paths against a recording pg double and
  // asserts every statement lands in the calling tenant's private schema only.
  it("writes and reads only the calling tenant's private schema, never a common public table", async () => {
    const planes = listSetupAiInitiativesPrivatePlanes();
    expect(planes).toHaveLength(3);
    for (const plane of planes) {
      const statements: string[] = [];
      const record = (sql: string) => {
        statements.push(sql);
        return Promise.resolve({ rows: [] });
      };
      process.env.DATABASE_URL = "postgres://recording-double/none";
      await jest.isolateModulesAsync(async () => {
        jest.doMock("pg", () => ({
          Pool: jest.fn().mockImplementation(() => ({
            query: jest.fn(record),
            connect: jest.fn(async () => ({
              query: jest.fn(record),
              release: jest.fn(),
            })),
          })),
        }));
        const persistence = await import("@/lib/setup/ai-initiatives-persistence");
        const records = getSetupAiInitiatives(plane.tenantKey).slice(0, 2);
        await expect(
          persistence.persistSetupAiInitiatives({
            tenantKey: plane.tenantKey,
            clientId: plane.tenantKey,
            documentName: "demo",
            fileName: "demo.yml",
            initiatives: records,
          }),
        ).resolves.toMatchObject({
          status: "persisted",
          privateSchema: plane.privateSchema,
          acceptedCount: 2,
        });
        await expect(
          persistence.listPersistedSetupAiInitiatives({ tenantKey: plane.tenantKey }),
        ).resolves.toMatchObject({ status: "private_db", privateSchema: plane.privateSchema });
      });

      const dataStatements = statements.filter(
        (sql) => !/^(begin|commit|rollback)$/i.test(sql.trim()),
      );
      // 1 batch insert + 2 x (initiative + audit) inserts + 1 select.
      expect(dataStatements).toHaveLength(6);
      const targets = dataStatements.map((sql) => {
        const found = [...sql.matchAll(/\b(?:insert\s+into|from)\s+("?[\w]+"?(?:\."?[\w]+"?)?)/gi)].map(
          (match) => match[1],
        );
        expect(found).toHaveLength(1);
        return found[0];
      });
      const expected = [
        plane.uploadBatchTable,
        plane.initiativeTable,
        plane.auditEventTable,
      ].map((table) => `"${plane.privateSchema}"."${table}"`);
      expect(new Set(targets)).toEqual(new Set(expected));
      for (const sql of dataStatements) {
        expect(sql).not.toMatch(/\bpublic\b/i);
        for (const other of planes) {
          if (other.privateSchema !== plane.privateSchema)
            expect(sql).not.toContain(other.privateSchema);
        }
      }
    }
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
