import {
  buildAdminDataLayerExplorerModel,
  buildGuardrailsReport,
  buildPageLayerMap,
  buildQualityChecksReport,
  buildReferenceDataAuditReport,
  buildSectionMap,
} from "@/lib/admin/data-layer-explorer";

describe("admin data layer explorer model", () => {
  const model = buildAdminDataLayerExplorerModel("Test tenant");

  it("covers the required journey sections and input categories", () => {
    expect(model.sections).toHaveLength(18);
    expect(model.inputCategories).toHaveLength(19);
    expect(model.pipelineSteps).toHaveLength(16);

    expect(model.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining([
        "overview",
        "input-files",
        "tenant-packet",
        "evidence",
        "known-facts",
        "relationships",
        "insights",
        "candidate-preview",
        "promotion-readiness",
        "active-access",
        "module-usage",
        "outcome-ledger",
        "benchmarks",
        "page-mapping",
        "quality-checks",
        "guardrails",
      ]),
    );
  });

  it("maps the required product pages to layer reads and write boundaries", () => {
    const pageLayerMap = buildPageLayerMap(model);
    expect(pageLayerMap.pages.map((page) => page.page)).toEqual([
      "Admin Overview",
      "Data Intake Library",
      "Tenant Packet Builder",
      "Candidate Preview",
      "Home",
      "Intelligence",
      "Moves",
      "Source",
      "Tower",
    ]);
    for (const page of pageLayerMap.pages) {
      expect(page.readsFrom.length).toBeGreaterThan(0);
      expect(page.doesNotWriteTo.length).toBeGreaterThan(0);
      expect(page.guardrails.length).toBeGreaterThan(0);
      expect(page.currentWiringStatus).toBeTruthy();
    }
  });

  it("keeps the page read-only and non-mutating", () => {
    const guardrails = buildGuardrailsReport(model);
    expect(guardrails.hardRuntimeBooleans).toEqual({
      productionTenantDataWritten: false,
      candidateCreated: false,
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
    });
  });

  it("builds proof maps with the expected counts", () => {
    expect(buildSectionMap(model).sectionCount).toBe(18);
    expect(buildQualityChecksReport(model).qualityCheckCount).toBe(14);
    expect(buildGuardrailsReport(model).guardrailCount).toBe(9);
  });

  it("surfaces SkyHarbor source richness and candidate coverage gaps", () => {
    const audit = buildReferenceDataAuditReport(model);

    expect(audit.audit.tenantKey).toBe("skyharbor-air");
    expect(audit.audit.status).toBe("review_required");
    expect(JSON.stringify(audit.audit.sourceRichness)).toContain(
      "900 structured rows",
    );
    expect(JSON.stringify(audit.audit.sourceRichness)).toContain(
      "Teradata Vantage on AWS",
    );
    expect(JSON.stringify(audit.audit.sourceRichness)).toContain("IBM Z");
    expect(JSON.stringify(audit.audit.candidateCoverage)).toContain(
      "2 declared files",
    );
    expect(JSON.stringify(audit.audit.candidateCoverage)).toContain(
      "0 relationship operations planned",
    );
    expect(audit.hardRuntimeBooleans).toEqual({
      productionTenantDataWritten: false,
      candidateCreated: false,
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
    });
  });

  it("surfaces active manifest completeness and excluded tenant controls", () => {
    const audit = model.manifestProjectionAudit;
    expect(audit.tenants.map((tenant) => tenant.tenantKey).sort()).toEqual([
      "meridian-health",
      "skyharbor-air",
    ]);

    const skyHarbor = audit.tenants.find(
      (tenant) => tenant.tenantKey === "skyharbor-air",
    );

    expect(skyHarbor).toBeTruthy();
    expect(skyHarbor?.status).toBe("complete");
    expect(skyHarbor?.sourceStructuredRows).toBe(5789);
    expect(skyHarbor?.candidateRecordsGenerated).toBe(5789);
    expect(skyHarbor?.blockers.length).toBe(0);
    expect(audit.uploadPathAlignment.adminUploadAlignment).toBe(
      "not_fully_aligned",
    );
    expect(audit.excludedTenants.length).toBeGreaterThan(0);
    expect(JSON.stringify(audit.skyHarborRequiredFindings)).toContain(
      "412-app portfolio",
    );
    expect(JSON.stringify(audit.skyHarborRequiredFindings)).toContain(
      "900-row older app/system estate",
    );
    expect(JSON.stringify(audit.skyHarborRequiredFindings)).toContain(
      "956-row transformed app/system template",
    );
    expect(JSON.stringify(audit.skyHarborRequiredFindings)).toContain(
      "13-row current upgrade candidate app/system file",
    );
    expect(audit.guardrails).toEqual({
      productionTenantDataWritten: false,
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      activeTenantTruthChanged: false,
    });
  });

  it("uses business-facing layer language in the generated model", () => {
    const serialized = JSON.stringify({
      ...model,
      manifestProjectionAudit: undefined,
    });
    for (const versionNumber of ["4", "6", "7"]) {
      expect(serialized).not.toContain(`V${versionNumber}`);
      expect(serialized).not.toContain(`v${versionNumber}`);
    }
    expect(serialized).not.toMatch(/\bmock\b/i);
    expect(serialized).toContain("Known Facts");
    expect(serialized).toContain("Relationships");
    expect(serialized).toContain("Insights");
  });
});
