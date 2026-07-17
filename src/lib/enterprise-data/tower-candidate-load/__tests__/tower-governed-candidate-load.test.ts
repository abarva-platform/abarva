import path from "node:path";

import { buildTowerGovernedCandidateLoadReport } from "../tower-governed-candidate-load";

const repoRoot = process.cwd();

describe("Tower governed candidate load path", () => {
  it("builds an inactive Meridian Tower candidate preview from v3 Tower dimensions", () => {
    const report = buildTowerGovernedCandidateLoadReport({
      repoRoot,
      generatedAt: "2026-07-17T00:00:00.000Z",
    });

    expect(report.tenantKey).toBe("meridian-health");
    expect(report.qualityGateStatus).toBe("pass");
    expect(report.candidateVersionId).toMatch(
      /^candidate:meridian-health:tower-v3:/,
    );
    expect(report.lineage.sourceFiles).toHaveLength(6);
    expect(report.lineage.sourceFiles.every((file) => file.rowCount > 0)).toBe(
      true,
    );
    expect(report.lineage.towerMetricRecordCount).toBeGreaterThan(0);
    expect(report.lineage.towerValueRecordCount).toBeGreaterThan(0);
    expect(report.lineage.towerValueClaimCount).toBeGreaterThan(0);
  });

  it("keeps candidate preview inactive and blocks runtime truth claims", () => {
    const report = buildTowerGovernedCandidateLoadReport({
      repoRoot,
      generatedAt: "2026-07-17T00:00:00.000Z",
    });

    expect(report.guardrails).toMatchObject({
      candidateLoadOnly: true,
      dryRunOnly: true,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
      towerRuntimeReadsCandidateByDefault: false,
      writesPhysicalTables: false,
      requiresAcaJobForMutation: true,
      requiresHumanPromotionApproval: true,
    });
    expect(report.candidatePreview.mode).toBe("candidate_preview");
    expect(report.candidatePreview.runtimeEligible).toBe(false);
    expect(report.candidatePreview.realizedValueLanguageAllowed).toBe(false);
    expect(report.candidatePreview.mustNotClaim).toContain(
      "candidate data is active tenant truth",
    );
    expect(report.truthSplit).toEqual({
      activeContextUpdated: false,
      candidatePreviewCreated: true,
      defaultTowerRuntimeChanged: false,
      cioTowerSourceOfTruth: "bridge_only_diagnostic",
      retrievalState: "not_loaded_not_indexed_not_retrieval_proven_not_cited",
    });
  });

  it("requires an ACA job contract before any mutating data-plane load", () => {
    const report = buildTowerGovernedCandidateLoadReport({
      repoRoot,
      generatedAt: "2026-07-17T00:00:00.000Z",
    });

    expect(report.acaJobContract).toMatchObject({
      jobName: "job-tower-governed-candidate-load",
      tenantScope: "meridian-health",
      status: "planned_not_submitted",
      operatorWrapper: "scripts/ops/submit-aca-operator-job.mjs",
      npmScript: "audit:tower-governed-candidate-load",
      timeoutSeconds: 7200,
    });
    expect(report.acaJobContract.idempotencyKey).toContain(
      report.candidateVersionId,
    );
    expect(report.qualityGateChecks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "manifest_declared",
        "tower_dimensions_present",
        "tower_records_have_evidence",
        "value_claims_gated",
        "realized_value_blocked",
        "cio_tower_bridge_only",
        "no_runtime_mutation",
        "candidate_preview_inactive",
      ]),
    );
  });

  it("fails fast if the required v3 input root is not available", () => {
    expect(() =>
      buildTowerGovernedCandidateLoadReport({
        repoRoot,
        inputRoot: path.join("datasets", "tenant-inputs", "missing"),
      }),
    ).toThrow(/missing_tower_v3_dimension/);
  });
});
