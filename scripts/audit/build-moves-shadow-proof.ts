import path from "node:path";

import { buildMovesShadowProof } from "../../src/lib/enterprise-data/moves-shadow-proof/moves-shadow-proof";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const proof = await buildMovesShadowProof({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: proof.qualityGateStatus,
        tenantKey: proof.tenantKey,
        candidateVersionId: proof.candidateVersionId,
        outputDir: path.dirname(
          "reports/moves-shadow-proof/skyharbor/moves-shadow-proof.json",
        ),
        selectedMoveId: proof.moveContext.selectedMoveId,
        selectedMoveName: proof.moveContext.selectedMoveName,
        phaseCount: proof.validationSummary.phaseCount,
        shadowReadyPhases: proof.validationSummary.shadowReadyPhases,
        partialPhases: proof.validationSummary.partialPhases,
        blockedPhases: proof.validationSummary.blockedPhases,
        currentStateFindings: proof.moveContext.currentStateFindings,
        goldenQuestions: proof.moveContext.goldenQuestions,
        proposedDeliverables: proof.validationSummary.proposedDeliverables,
        proposedModuleMemoryRecords:
          proof.validationSummary.proposedModuleMemoryRecords,
        evidenceTraceCount: proof.validationSummary.evidenceTraceCount,
        guardrails: proof.guardrails,
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
