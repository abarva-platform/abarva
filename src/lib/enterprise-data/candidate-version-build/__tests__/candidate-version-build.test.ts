import {
  buildCandidateVersionBuildReport,
  evaluateCandidateVersionBuildReport,
  loadCandidateVersionBuildForAdmin,
} from "../candidate-version-build";

describe("candidate version build from canonical tenant data", () => {
  let report: Awaited<ReturnType<typeof buildCandidateVersionBuildReport>>;

  beforeAll(async () => {
    report = await buildCandidateVersionBuildReport({
      repoRoot: process.cwd(),
      generatedAt: "2026-07-14T00:00:00.000Z",
    });
  }, 30000);

  it("creates inactive candidate versions for all active tenants", () => {
    expect(report.summary.tenantsProcessed).toBe(6);
    expect(report.summary.candidateVersionsCreated).toBe(6);
    expect(report.summary.tenantsBlocked).toBe(0);
    expect(report.candidateVersions.some((candidate) => candidate.tenantKey === "northstar-clinical")).toBe(false);
    expect(report.candidateVersions.every((candidate) => candidate.status === "inactive")).toBe(true);
    expect(report.candidateVersions.every((candidate) => candidate.mode === "candidate_preview")).toBe(true);
  });

  it("preserves active/candidate separation guardrails", () => {
    expect(report.guardrails.productionTenantDataWritten).toBe(false);
    expect(report.guardrails.activeTenantAccessLayerUpdated).toBe(false);
    expect(report.guardrails.candidatePromoted).toBe(false);
    expect(report.guardrails.moduleRuntimeConsumptionChanged).toBe(false);
    expect(report.guardrails.moduleReadsCandidateByDefault).toBe(false);
    expect(report.guardrails.defaultHomeReadsCandidateData).toBe(false);
    expect(report.activeCandidateSeparation.defaultHomeRuntimeSource).toBe("active_home_context");
    expect(report.activeCandidateSeparation.candidatePreviewRuntimeSource).toBe("inactive_candidate_read_model");
  });

  it("carries lineage and evidence into each candidate", () => {
    for (const candidate of report.candidateVersions) {
      expect(candidate.sourceBuildFingerprint).toHaveLength(64);
      expect(candidate.inputFingerprint).toHaveLength(64);
      expect(candidate.canonicalRecordCount).toBeGreaterThan(0);
      expect(candidate.evidenceAttachmentCount).toBeGreaterThanOrEqual(candidate.canonicalRecordCount);
      expect(candidate.sourceLineage.length).toBeGreaterThan(0);
      expect(candidate.readModelSamples.length).toBeGreaterThan(0);
      expect(candidate.qualityGates.every((gate) => gate.status !== "fail")).toBe(true);
    }
  });

  it("proves the SkyHarbor richness correction in candidate preview form", () => {
    const skyharbor = report.skyharborPreview;
    expect(skyharbor).toBeTruthy();
    const domains = Object.fromEntries(
      skyharbor!.domainCounts.map((entry) => [entry.domain, entry.acceptedRecords]),
    );
    expect(domains.applications_systems).toBe(626);
    expect(domains.data_assets_integrations).toBe(570);
    expect(domains.infrastructure_platforms).toBe(691);
    expect(skyharbor!.creationStatus).toBe("created");
  });

  it("proves Meridian healthcare context and keeps downstream readiness cautious", () => {
    const meridian = report.meridianPreview;
    expect(meridian).toBeTruthy();
    const domains = Object.fromEntries(
      meridian!.domainCounts.map((entry) => [entry.domain, entry.acceptedRecords]),
    );
    expect(domains.applications_systems).toBe(192);
    expect(domains.data_assets_integrations).toBe(432);
    expect(domains.infrastructure_platforms).toBe(4);
    expect(JSON.stringify(meridian!.homeAvaReadiness.mustNotClaim).toLowerCase()).toContain(
      "candidate data is active tenant truth",
    );
  });

  it("passes the candidate-version evaluator", () => {
    const evaluation = evaluateCandidateVersionBuildReport(report);
    expect(evaluation).toEqual({ ok: true, errors: [] });
  });

  it("can build the admin preview read model without a bundled report artifact", async () => {
    const fallback = await loadCandidateVersionBuildForAdmin({
      repoRoot: process.cwd(),
      forceRuntimeFallback: true,
    });
    expect(fallback.source).toBe("runtime_deterministic_fallback");
    expect(fallback.errors).toEqual([]);
    expect(fallback.report?.skyharborPreview?.domainCounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "applications_systems",
          acceptedRecords: 626,
        }),
      ]),
    );
    expect(fallback.report?.guardrails.productionTenantDataWritten).toBe(false);
    expect(fallback.report?.guardrails.candidatePromoted).toBe(false);
  }, 30000);
});
