import path from "node:path";

import { buildCandidatePreviewEnablement } from "../../src/lib/enterprise-data/candidate-preview-enablement/candidate-preview-enablement";
import type { CandidatePreviewModule } from "../../src/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";

interface Args {
  outputDir?: string;
  generatedAt?: string;
  module?: CandidatePreviewModule;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildCandidatePreviewEnablement({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
    request: {
      ...(args.module ? { module: args.module } : {}),
      requestSource: "audit",
    },
  });

  console.log(
    JSON.stringify(
      {
        status: report.qualityGateStatus,
        tenantKey: report.tenantKey,
        candidateVersionId: report.candidateVersionId,
        explicitRequestAccepted: report.explicitRequestAccepted,
        defaultRequestRejected: report.defaultRequestRejected,
        missingAcknowledgementRejected:
          report.missingAcknowledgementRejected,
        selectedModule: report.selectedModulePacket.module,
        modulesInspected: report.moduleInspections.length,
        activeTenantAccessLayerUpdated:
          report.guardrails.activeTenantAccessLayerUpdated,
        candidatePromoted: report.guardrails.candidatePromoted,
        productionTenantDataWritten:
          report.guardrails.productionTenantDataWritten,
        moduleReadsCandidateByDefault:
          report.guardrails.moduleReadsCandidateByDefault,
        outputDir: path.dirname(report.outputPaths.jsonPath),
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
    } else if (arg === "--module" && next) {
      args.module = parseModule(next);
      index += 1;
    }
  }
  return args;
}

function parseModule(value: string): CandidatePreviewModule {
  if (
    value === "home" ||
    value === "intelligence" ||
    value === "moves" ||
    value === "source" ||
    value === "tower"
  ) {
    return value;
  }
  throw new Error(`Unsupported preview module: ${value}`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
