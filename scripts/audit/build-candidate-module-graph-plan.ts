import path from "node:path";

import { buildCandidateModuleGraphPlan } from "../../src/lib/enterprise-data/candidate-preview/candidate-module-graph-plan";

interface Args {
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  moduleDerivedPlanPath?: string;
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const proof = await buildCandidateModuleGraphPlan({
    repoRoot: process.cwd(),
    candidateRecordPath: args.candidateRecordPath,
    moduleReadinessProofPath: args.moduleReadinessProofPath,
    moduleDerivedPlanPath: args.moduleDerivedPlanPath,
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: proof.summary.qualityGateStatus,
        tenantKey: proof.summary.tenantKey,
        candidateVersionKey: proof.summary.candidateVersionKey,
        outputDir: path.dirname(proof.summary.outputPaths.summaryPath),
        requestedModules: proof.summary.requestedModules,
        graphObjectsPlanned: proof.summary.counts.graphObjectsPlanned,
        graphNodesPlanned: proof.summary.counts.graphNodesPlanned,
        graphEdgesPlanned: proof.summary.counts.graphEdgesPlanned,
        runtimeReadyModules: proof.summary.counts.runtimeReadyModules,
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
    } else if (arg === "--module-derived-plan" && next) {
      args.moduleDerivedPlanPath = next;
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
