#!/usr/bin/env tsx

import path from "node:path";

import { buildAllTenantCandidateBatch } from "../../src/lib/enterprise-data/all-tenant-candidate-batch/all-tenant-candidate-batch";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildAllTenantCandidateBatch({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: "pass",
        reportVersion: report.reportVersion,
        outputDir: path.dirname(
          args.outputDir
            ? `${args.outputDir}/all-tenant-candidate-batch.json`
            : "reports/all-tenant-candidate-batch/all-tenant-candidate-batch.json",
        ),
        totalTenantsScanned: report.rollup.totalTenantsScanned,
        eligibleTenants: report.rollup.eligibleTenants,
        partiallyEligibleTenants: report.rollup.partiallyEligibleTenants,
        blockedTenants: report.rollup.blockedTenants,
        notEnoughEvidenceTenants: report.rollup.notEnoughEvidenceTenants,
        totalCandidateRecordsGenerated:
          report.rollup.totalCandidateRecordsGenerated,
        totalPlannedTargetOperations:
          report.rollup.totalPlannedTargetOperations,
        totalUnmappedFields: report.rollup.totalUnmappedFields,
        totalQuarantinedRecords: report.rollup.totalQuarantinedRecords,
        totalStrandedIntelligenceRecords:
          report.rollup.totalStrandedIntelligenceRecords,
        guardrails: {
          dryRunOnly: report.dryRunOnly,
          productionTenantDataWritten: report.productionTenantDataWritten,
          activeTenantAccessLayerUpdated:
            report.activeTenantAccessLayerUpdated,
          candidatePromoted: report.candidatePromoted,
          writesPhysicalTables: report.writesPhysicalTables,
          moduleRuntimeConsumptionChanged:
            report.moduleRuntimeConsumptionChanged,
          candidateReadByDefault: report.candidateReadByDefault,
          realizedValueClaimed: report.realizedValueClaimed,
        },
      },
      null,
      2,
    ),
  );
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--out-dir" && next) {
      args.outputDir = next;
      index += 1;
    } else if (arg === "--generated-at" && next) {
      args.generatedAt = next;
      index += 1;
    }
  }
  return args;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
