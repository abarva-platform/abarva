#!/usr/bin/env tsx

import path from "node:path";

import { buildSkyHarborApplicationsCandidateRegeneration } from "../../src/lib/enterprise-data/remediation/skyharbor-applications-candidate-regeneration";

const args = new Map<string, string>();

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const nextValue = process.argv[index + 1];
  if (nextValue && !nextValue.startsWith("--")) {
    args.set(key, nextValue);
    index += 1;
  } else {
    args.set(key, "true");
  }
}

async function main(): Promise<void> {
  const result = await buildSkyHarborApplicationsCandidateRegeneration({
    repoRoot: process.cwd(),
    generatedAt: args.get("generated-at"),
    outputDir: path.normalize(
      args.get("out-dir") ?? "reports/data-remediation/skyharbor-applications/latest",
    ),
  });

  console.log(
    JSON.stringify(
      {
        tenantKey: result.tenantKey,
        selectedSource: result.selectedSource.label,
        sourceRows: result.counts.authoritativeSourceRows,
        acceptedCandidateRecords: result.counts.acceptedCandidateRecords,
        warningCandidateRecords: result.counts.warningCandidateRecords,
        quarantinedRows: result.counts.quarantinedRows,
        relationshipCandidatesPlanned: result.counts.relationshipCandidatesPlanned,
        sourceConflictsReported: result.counts.sourceConflictsReported,
        materialExpansionAchieved: result.candidatePreviewSummary.materialExpansionAchieved,
        dryRunOnly: result.dryRunOnly,
        productionTenantDataWritten: result.productionTenantDataWritten,
        candidatePromoted: result.candidatePromoted,
        activeTenantAccessLayerUpdated: result.activeTenantAccessLayerUpdated,
        moduleRuntimeConsumptionChanged: result.moduleRuntimeConsumptionChanged,
        activeHomeContextChanged: result.activeHomeContextChanged,
        proofOutputDir: result.proofOutputDir,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
