import path from "node:path";

import { buildSourceShadowProof } from "../../src/lib/enterprise-data/source-shadow-proof/source-shadow-proof";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const proof = await buildSourceShadowProof({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: proof.validationSummary.qualityGateStatus,
        tenantKey: proof.tenantKey,
        candidateVersionId: proof.candidateVersionId,
        outputDir: path.dirname(
          "reports/source-shadow-proof/skyharbor/source-shadow-proof.json",
        ),
        readinessStatus: proof.sourceOpportunityAssessment.readinessStatus,
        candidateFactsInspected: proof.sourceContext.canonicalRecordsInspected,
        evidenceRefs: new Set(
          proof.evidenceTrace.flatMap((trace) => trace.evidenceRefs),
        ).size,
        leverageFindings: proof.validationSummary.leverageFindingCount,
        proposedMemoryRecords:
          proof.validationSummary.proposedMemoryRecordCount,
        towerHandoffPreviewRecords: 1,
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
