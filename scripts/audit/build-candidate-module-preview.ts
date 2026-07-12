import path from "node:path";

import { buildCandidateModulePreview } from "../../src/lib/enterprise-data/candidate-preview/candidate-module-preview";

interface Args {
  candidateRecordPath?: string;
  promotionGatePath?: string;
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const proof = await buildCandidateModulePreview({
    repoRoot: process.cwd(),
    candidateRecordPath: args.candidateRecordPath,
    promotionGatePath: args.promotionGatePath,
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: proof.summary.previewQualityGateStatus,
        tenantKey: proof.summary.tenantKey,
        candidateVersionKey: proof.summary.candidateVersionKey,
        canonicalRecordsRead: proof.summary.counts.canonicalRecordsRead,
        evidenceKeys: proof.summary.counts.evidenceKeys,
        homeFacts: proof.summary.counts.homeFacts,
        intelligenceFacts: proof.summary.counts.intelligenceFacts,
        outputDir: path.dirname(proof.summary.outputPaths.summaryPath),
        blockers: proof.summary.blockers,
        guardrails: proof.summary.guardrails,
      },
      null,
      2,
    ),
  );

  if (proof.summary.previewQualityGateStatus !== "pass") {
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--candidate-record" && next) {
      args.candidateRecordPath = next;
      index += 1;
    } else if (arg === "--promotion-gate" && next) {
      args.promotionGatePath = next;
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
