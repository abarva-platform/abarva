import path from "node:path";

import { buildCandidateModuleDerivedPlan } from "../../src/lib/enterprise-data/candidate-preview/candidate-module-derived-plan";

interface Args {
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const proof = await buildCandidateModuleDerivedPlan({
    repoRoot: process.cwd(),
    candidateRecordPath: args.candidateRecordPath,
    moduleReadinessProofPath: args.moduleReadinessProofPath,
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
        derivedObjectsPlanned: proof.summary.counts.derivedObjectsPlanned,
        movesFactsCovered: proof.summary.counts.movesFactsCovered,
        sourceFactsCovered: proof.summary.counts.sourceFactsCovered,
        towerFactsCovered: proof.summary.counts.towerFactsCovered,
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
