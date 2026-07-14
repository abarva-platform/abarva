#!/usr/bin/env tsx

import {
  buildCandidateVersionBuildReport,
} from "../../src/lib/enterprise-data/candidate-version-build/candidate-version-build";

async function main(): Promise<void> {
  const report = await buildCandidateVersionBuildReport({
    repoRoot: process.cwd(),
  });
  const separation = report.activeCandidateSeparation;
  const errors: string[] = [];
  if (separation.defaultHomeReadsCandidateData) {
    errors.push("Default Home reads candidate data.");
  }
  if (separation.moduleRuntimeReadsCandidateByDefault) {
    errors.push("Module runtime reads candidate data by default.");
  }
  if (separation.activeTenantAccessLayerUpdated) {
    errors.push("Active Tenant Access was updated.");
  }
  if (separation.candidatePromoted) {
    errors.push("Candidate was promoted.");
  }
  if (separation.productionTenantDataWritten) {
    errors.push("Production tenant data was written.");
  }
  if (!report.guardrails.candidatePreviewRequiresExplicitMode) {
    errors.push("Candidate preview does not require explicit mode.");
  }

  console.log(JSON.stringify({
    audit: "active-candidate-separation",
    ok: errors.length === 0,
    separation,
    candidatePreviewRequiresExplicitMode: report.guardrails.candidatePreviewRequiresExplicitMode,
    errors,
  }, null, 2));

  if (errors.length > 0) {
    throw new Error(`Active/candidate separation audit failed: ${errors.join("; ")}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
