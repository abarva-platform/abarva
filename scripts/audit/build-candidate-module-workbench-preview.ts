import path from "node:path";

import { buildCandidateModuleWorkbenchPreview } from "../../src/lib/enterprise-data/candidate-preview/candidate-module-workbench-preview";

interface Args {
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  moduleReadinessPreviewPath?: string;
  derivedPlanStagePath?: string;
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const proof = await buildCandidateModuleWorkbenchPreview({
    repoRoot: process.cwd(),
    candidateRecordPath: args.candidateRecordPath,
    moduleReadinessProofPath: args.moduleReadinessProofPath,
    moduleReadinessPreviewPath: args.moduleReadinessPreviewPath,
    derivedPlanStagePath: args.derivedPlanStagePath,
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: proof.summary.previewQualityGateStatus,
        tenantKey: proof.summary.tenantKey,
        candidateVersionKey: proof.summary.candidateVersionKey,
        outputDir: path.dirname(proof.summary.outputPaths.summaryPath),
        requestedModules: proof.summary.requestedModules,
        workbenchPreviewPackets: proof.summary.counts.workbenchPreviewPackets,
        runtimeReadyModules: proof.summary.counts.runtimeReadyModules,
        movesFacts: proof.summary.counts.movesFacts,
        sourceFacts: proof.summary.counts.sourceFacts,
        towerFacts: proof.summary.counts.towerFacts,
        guardrails: proof.summary.guardrails,
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
    if (arg === "--candidate-record" && next) {
      args.candidateRecordPath = next;
      index += 1;
    } else if (arg === "--module-readiness-proof" && next) {
      args.moduleReadinessProofPath = next;
      index += 1;
    } else if (arg === "--module-readiness-preview" && next) {
      args.moduleReadinessPreviewPath = next;
      index += 1;
    } else if (arg === "--derived-plan-stage" && next) {
      args.derivedPlanStagePath = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
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
