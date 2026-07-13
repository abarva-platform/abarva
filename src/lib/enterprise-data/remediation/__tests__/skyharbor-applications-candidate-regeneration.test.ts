import {
  buildSkyHarborApplicationsCandidateRegeneration,
  readLatestSkyHarborApplicationsRegeneration,
} from "../skyharbor-applications-candidate-regeneration";

describe("SkyHarbor applications/systems candidate regeneration", () => {
  let result: Awaited<ReturnType<typeof buildSkyHarborApplicationsCandidateRegeneration>>;

  beforeAll(async () => {
    result = await buildSkyHarborApplicationsCandidateRegeneration({
      repoRoot: process.cwd(),
      generatedAt: "2026-07-13T00:00:00.000Z",
      writeReports: false,
    });
  }, 30000);

  it("selects the 900-row estate as authoritative and does not silently merge weak sources", () => {
    expect(result.selectedSource.label).toBe("900-row older app/system estate");
    expect(result.selectedSource.rowCount).toBe(900);
    expect(result.sourceSelection).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "412-app portfolio CSV from Downloads",
          role: "supporting",
          rowCount: 412,
        }),
        expect.objectContaining({
          label: "956-row transformed app/system template",
          role: "excluded",
          rowCount: 956,
        }),
        expect.objectContaining({
          label: "13-row current upgrade candidate app/system file",
          role: "excluded",
          rowCount: 13,
        }),
      ]),
    );
    expect(JSON.stringify(result.sourceConflicts)).toContain(
      "placeholder_identity_in_transformed_template",
    );
  });

  it("materially expands the inactive application/system candidate with evidence", () => {
    expect(result.counts.authoritativeSourceRows).toBe(900);
    expect(result.counts.acceptedCandidateRecords).toBe(900);
    expect(result.counts.canonicalIngestionRecords).toBe(900);
    expect(result.counts.evidenceReferencesAttached).toBe(900);
    expect(result.counts.quarantinedRows).toBe(0);
    expect(result.candidatePreviewSummary.currentThinCandidateRows).toBe(13);
    expect(result.candidatePreviewSummary.currentCandidateBaselineRecords).toBe(53);
    expect(result.candidatePreviewSummary.materialExpansionAchieved).toBe(true);
  });

  it("plans relationship candidates without promoting or changing runtime truth", () => {
    expect(result.counts.relationshipCandidatesPlanned).toBe(4500);
    expect(result.relationshipSummary).toEqual({
      business_function_to_system: 900,
      system_to_platform: 900,
      system_to_owner: 900,
      system_to_vendor: 900,
      system_to_source_evidence: 900,
    });
    expect(result.dryRunOnly).toBe(true);
    expect(result.productionTenantDataWritten).toBe(false);
    expect(result.candidatePromoted).toBe(false);
    expect(result.activeTenantAccessLayerUpdated).toBe(false);
    expect(result.moduleRuntimeConsumptionChanged).toBe(false);
    expect(result.activeHomeContextChanged).toBe(false);
    expect(result.homeAdminPreviewImpact.candidateDataLeaksIntoDefaultHome).toBe(false);
  });

  it("reports upload alignment as a follow-up instead of blocking this dry-run", () => {
    expect(result.uploadPathAlignment.selectedSourcePathMode).toBe("repo_dataset_path");
    expect(result.uploadPathAlignment.selectedSourceUsesCanonicalLanding).toBe(false);
    expect(result.uploadPathAlignment.blocksThisDryRun).toBe(false);
    expect(result.uploadPathAlignment.followUp).toContain("DATA-PR33");
  });

  it("reads the generated latest report without changing active runtime truth", () => {
    const fallback = readLatestSkyHarborApplicationsRegeneration(process.cwd());
    expect(fallback.counts.acceptedCandidateRecords).toBe(900);
    expect(fallback.homeAdminPreviewImpact.defaultHomeActiveContextChanged).toBe(false);
  });
});
