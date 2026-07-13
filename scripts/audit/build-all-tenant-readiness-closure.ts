#!/usr/bin/env tsx

import path from "node:path";

import { buildAllTenantReadinessClosure } from "../../src/lib/enterprise-data/all-tenant-readiness-closure/all-tenant-readiness-closure";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildAllTenantReadinessClosure({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: report.qualityGateStatus,
        reportVersion: report.reportVersion,
        outputDir: path.dirname(report.outputPaths.jsonPath),
        totalTenantsScanned: report.executiveSummary.totalTenantsScanned,
        candidatePreviewReadyTenants:
          report.executiveSummary.candidatePreviewReadyTenants,
        remediationReadyTenants:
          report.executiveSummary.remediationReadyTenants,
        blockedTenants: report.executiveSummary.blockedTenants,
        safeDemoTenantForNextDryRun:
          report.executiveSummary.safeDemoTenantForNextDryRun,
        activePromotionReadyTenants:
          report.executiveSummary.activePromotionReadyTenants,
        guardrails: report.guardrails,
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
