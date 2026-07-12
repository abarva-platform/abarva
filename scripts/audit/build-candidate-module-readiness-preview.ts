import path from "node:path";

import { buildCandidateModuleReadinessPreview } from "../../src/lib/enterprise-data/candidate-preview/candidate-module-readiness-preview";

interface Args {
  candidateRecordPath?: string;
  moduleReadinessProofPath?: string;
  candidateModulePreviewSummaryPath?: string;
  promotionGatePath?: string;
  tenantEligibilityMatrixPath?: string;
  moduleTargetedDerivedPlanPath?: string;
  moduleTargetedGraphPlanPath?: string;
  workbenchPreviewSummaryPath?: string;
  outputDir?: string;
  generatedAt?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const preview = await buildCandidateModuleReadinessPreview({
    repoRoot: process.cwd(),
    candidateRecordPath: args.candidateRecordPath,
    moduleReadinessProofPath: args.moduleReadinessProofPath,
    candidateModulePreviewSummaryPath: args.candidateModulePreviewSummaryPath,
    promotionGatePath: args.promotionGatePath,
    tenantEligibilityMatrixPath: args.tenantEligibilityMatrixPath,
    moduleTargetedDerivedPlanPath: args.moduleTargetedDerivedPlanPath,
    moduleTargetedGraphPlanPath: args.moduleTargetedGraphPlanPath,
    workbenchPreviewSummaryPath: args.workbenchPreviewSummaryPath,
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: preview.summary.qualityGateStatus,
        tenantKey: preview.summary.tenantKey,
        candidateVersionKey: preview.summary.candidateVersionKey,
        outputDir: path.dirname(preview.summary.outputPaths.readinessSummaryPath),
        modulesEvaluated: preview.summary.counts.modulesEvaluated,
        previewPacketModules: preview.summary.counts.previewPacketModules,
        candidateContextModules: preview.summary.counts.candidateContextModules,
        blockedModules: preview.summary.counts.blockedModules,
        runtimeReadyModules: preview.summary.counts.runtimeReadyModules,
        guardrails: preview.summary.guardrails,
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
    } else if (arg === "--candidate-module-preview-summary" && next) {
      args.candidateModulePreviewSummaryPath = next;
      index += 1;
    } else if (arg === "--promotion-gate" && next) {
      args.promotionGatePath = next;
      index += 1;
    } else if (arg === "--tenant-eligibility-matrix" && next) {
      args.tenantEligibilityMatrixPath = next;
      index += 1;
    } else if (arg === "--module-targeted-derived-plan" && next) {
      args.moduleTargetedDerivedPlanPath = next;
      index += 1;
    } else if (arg === "--module-targeted-graph-plan" && next) {
      args.moduleTargetedGraphPlanPath = next;
      index += 1;
    } else if (arg === "--workbench-preview-summary" && next) {
      args.workbenchPreviewSummaryPath = next;
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
