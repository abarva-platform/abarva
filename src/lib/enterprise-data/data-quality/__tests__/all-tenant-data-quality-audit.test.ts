import {
  assertCandidateCoverageAudit,
  assertTenantIsolationAudit,
  buildAllTenantDataQualityAudit,
  readLatestTenantQualityMatrix,
} from "../all-tenant-data-quality-audit";

describe("all-tenant data quality audit", () => {
  let report: Awaited<ReturnType<typeof buildAllTenantDataQualityAudit>>;

  beforeAll(async () => {
    report = await buildAllTenantDataQualityAudit({
      repoRoot: process.cwd(),
      outputDir: "reports/data-quality/all-tenants/test",
      generatedAt: "2026-07-13T00:00:00.000Z",
    });
  }, 30000);

  it("keeps the audit non-destructive", () => {
    expect(report.dryRunOnly).toBe(true);
    expect(report.productionTenantDataWritten).toBe(false);
    expect(report.activeTenantAccessLayerUpdated).toBe(false);
    expect(report.candidatePromoted).toBe(false);
    expect(report.writesPhysicalTables).toBe(false);
    expect(report.moduleRuntimeConsumptionChanged).toBe(false);
    expect(report.moduleReadsCandidateByDefault).toBe(false);
    expect(report.realizedValueClaimed).toBe(false);
  });

  it("surfaces SkyHarbor as source-rich and candidate-thin", () => {
    const skyHarbor = report.tenantQualityMatrix.find(
      (row) => row.tenantKey === "skyharbor-air",
    );
    expect(skyHarbor).toBeDefined();
    expect(skyHarbor?.sourceRichnessScore).toBeGreaterThanOrEqual(70);
    expect(skyHarbor?.sourceStructuredRows).toBeGreaterThanOrEqual(3000);
    expect(skyHarbor?.candidateRecordsGenerated).toBe(53);
    expect(skyHarbor?.sourceRichCandidateThin).toBe(true);
    expect(skyHarbor?.falseGreenRisk).toBe(true);
    expect(skyHarbor?.promotionReadinessStatus).toBe("blocked");
  });

  it("retains the rich SkyHarbor systems and data-estate signals", () => {
    const source = report.sourceEstateCoverage.find(
      (row) => row.tenantKey === "skyharbor-air",
    );
    expect(source).toBeDefined();
    expect(source?.evidenceSignals).toEqual(
      expect.arrayContaining([
        "mainframe-core",
        "teradata-estate",
        "analytics-toolchain",
        "sap-estate",
      ]),
    );
    expect(JSON.stringify(source?.representativeFiles)).toContain(
      "F05_applications-systems.csv",
    );
    expect(JSON.stringify(source?.representativeFiles)).toContain(
      "F10_integrations-interfaces.csv",
    );
  });

  it("marks zero relationship operations as a graph quality gap", () => {
    const graph = report.relationshipGraphQuality.find(
      (row) => row.tenantKey === "skyharbor-air",
    );
    expect(graph?.relationshipOperationCount).toBe(0);
    expect(graph?.status).toBe("gap");
    expect(JSON.stringify(graph?.findings)).toContain(
      "zero relationship operations",
    );
  });

  it("does not let source-rich candidate-thin tenants pass promotion quality", () => {
    expect(() => assertCandidateCoverageAudit(report)).not.toThrow();
    const unsafePass = report.tenantQualityMatrix.filter(
      (row) => row.sourceRichCandidateThin && row.promotionReadinessStatus === "pass",
    );
    expect(unsafePass).toHaveLength(0);
  });

  it("checks tenant isolation without cross-tenant candidate leakage", () => {
    expect(() => assertTenantIsolationAudit(report)).not.toThrow();
    expect(report.rollup.tenantIsolationFailures).toBe(0);
  });

  it("returns an embedded matrix when report files are absent from the runtime image", async () => {
    const matrix = await readLatestTenantQualityMatrix("/tmp/no-report-root");
    expect(matrix?.rollup.sourceRichCandidateThinTenants).toBe(6);
    expect(matrix?.tenants.find((row) => row.tenantKey === "skyharbor-air")).toMatchObject({
      candidateRecordsGenerated: 53,
      relationshipOperationCount: 0,
      sourceRichCandidateThin: true,
    });
  });
});
