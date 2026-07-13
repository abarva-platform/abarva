#!/usr/bin/env tsx

import path from "node:path";

import {
  buildAdminDataQualityControlModel,
  writeAdminDataQualityProofArtifacts,
} from "../../src/lib/admin/admin-data-quality-control";

interface Args {
  outputDir?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(
    process.cwd(),
    args.outputDir ?? "reports/admin-data-quality/latest",
  );
  const model = await buildAdminDataQualityControlModel(process.cwd());
  const outputPaths = await writeAdminDataQualityProofArtifacts(model, outputDir);

  const skyHarbor = model.tenantDetails.find(
    (tenant) => tenant.tenantKey === "skyharbor-air",
  );
  const status = model.p0.length === 0 && model.p1.length === 0 ? "pass" : "review";

  console.log(
    JSON.stringify(
      {
        status,
        outputDir,
        tenantsShown: model.tenantDetails.length,
        p0: model.p0,
        p1: model.p1,
        p2: model.p2,
        guardrails: model.guardrails,
        skyHarbor: skyHarbor
          ? {
              sourceStructuredRows:
                skyHarbor.sourceVsCandidateCoverage.sourceStructuredRows,
              candidateRecordsGenerated:
                skyHarbor.sourceVsCandidateCoverage.candidateRecordsGenerated,
              sourceRichCandidateThin:
                skyHarbor.sourceVsCandidateCoverage.sourceRichCandidateThin,
              relationshipOperationCount:
                skyHarbor.relationshipQuality?.relationshipOperationCount ?? 0,
              promotionUnsafe: skyHarbor.matrix.promotionUnsafe,
              topBlocker: skyHarbor.topBlocker,
            }
          : null,
        artifacts: outputPaths,
      },
      null,
      2,
    ),
  );

  if (model.p0.length > 0 || model.p1.length > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--out-dir" && next) {
      args.outputDir = next;
      index += 1;
    }
  }
  return args;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
