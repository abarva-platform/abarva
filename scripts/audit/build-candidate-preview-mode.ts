import path from "node:path";

import { buildCandidatePreviewMode } from "../../src/lib/enterprise-data/candidate-preview-mode/candidate-preview-mode";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildCandidatePreviewMode({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: report.qualityGateStatus,
        tenantKey: report.tenantKey,
        candidateVersionId: report.candidateVersionId,
        previewModeState: report.previewModeState,
        outputDir: path.dirname(
          "reports/candidate-preview-mode/skyharbor/candidate-preview-mode.json",
        ),
        selectableModules: report.explicitPreviewReadiness.selectableModules,
        runtimeReadyModules: report.explicitPreviewReadiness.runtimeReadyModules,
        defaultCandidateReads:
          report.explicitPreviewReadiness.defaultCandidateReads,
        blockedActions: report.blockedActions.length,
        nextProofRequired: report.nextProofRequired.length,
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
