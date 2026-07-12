import path from "node:path";

import { buildCandidateReadinessControl } from "../../src/lib/enterprise-data/candidate-readiness-control/candidate-readiness-control";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildCandidateReadinessControl({
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
        readinessState: report.readinessState,
        outputDir: path.dirname(
          "reports/candidate-readiness-control/skyharbor/candidate-readiness-control.json",
        ),
        artifactsPresent: report.artifactChecklist.length,
        modulesEvaluated: report.moduleControl.length,
        runtimeReadyModules: report.moduleControl.filter(
          (row) => row.runtimeConsumptionReady,
        ).length,
        blockersRemaining: report.executiveSummary.blockersRemaining,
        criteriaBeforeActivePromotion:
          report.executiveSummary.exactCriteriaBeforeActivePromotion.length,
        allTenantContext: report.allTenantContext,
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
