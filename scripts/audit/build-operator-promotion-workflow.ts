import path from "node:path";

import { buildOperatorPromotionWorkflow } from "../../src/lib/enterprise-data/operator-promotion-workflow/operator-promotion-workflow";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildOperatorPromotionWorkflow({
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
        workflowState: report.workflowState,
        outputDir: path.dirname(
          "reports/operator-promotion-workflow/skyharbor/operator-promotion-workflow.json",
        ),
        currentGateDecision: report.promotionDecision.currentGateDecision,
        promotionEnabled: report.promotionDecision.promotionEnabled,
        activePromotionAttempted:
          report.promotionDecision.activePromotionAttempted,
        workflowSteps: report.workflowSteps.length,
        approvalChecklistItems: report.approvalChecklist.length,
        blockedActions: report.blockedActions.length,
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
