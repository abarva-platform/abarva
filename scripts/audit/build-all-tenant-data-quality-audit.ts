#!/usr/bin/env tsx

import path from "node:path";

import { buildAllTenantDataQualityAudit } from "../../src/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildAllTenantDataQualityAudit({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });
  const outputDir =
    args.outputDir ?? "reports/data-quality/all-tenants/latest";

  console.log(
    JSON.stringify(
      {
        status: "pass",
        reportVersion: report.reportVersion,
        outputDir: path.normalize(outputDir),
        rollup: report.rollup,
        sourceRichCandidateThinTenants: report.tenantQualityMatrix
          .filter((row) => row.sourceRichCandidateThin)
          .map((row) => row.tenantKey),
        falseGreenRiskTenants: report.tenantQualityMatrix
          .filter((row) => row.falseGreenRisk)
          .map((row) => row.tenantKey),
        guardrails: {
          dryRunOnly: report.dryRunOnly,
          productionTenantDataWritten: report.productionTenantDataWritten,
          activeTenantAccessLayerUpdated: report.activeTenantAccessLayerUpdated,
          candidatePromoted: report.candidatePromoted,
          writesPhysicalTables: report.writesPhysicalTables,
          moduleRuntimeConsumptionChanged:
            report.moduleRuntimeConsumptionChanged,
          moduleReadsCandidateByDefault: report.moduleReadsCandidateByDefault,
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
