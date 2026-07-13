import path from "node:path";

import { writeAdminDataLayerExplorerProof } from "../../src/lib/admin/data-layer-explorer";

interface Args {
  outputDir?: string;
  generatedFor?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = writeAdminDataLayerExplorerProof({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedFor: args.generatedFor,
  });

  console.log(
    JSON.stringify(
      {
        status: "pass",
        generatedFor: report.model.generatedFor,
        sections: report.model.sections.length,
        inputCategories: report.model.inputCategories.length,
        pipelineSteps: report.model.pipelineSteps.length,
        pageMappings: report.model.pageMappings.length,
        qualityChecks: report.model.qualityChecks.length,
        guardrails: report.model.guardrails.length,
        productionTenantDataWritten: false,
        candidateCreated: false,
        candidatePromoted: false,
        activeTenantAccessLayerUpdated: false,
        moduleRuntimeConsumptionChanged: false,
        outputDir: path.dirname(report.outputPaths.summaryPath),
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
    } else if (arg === "--generated-for" && next) {
      args.generatedFor = next;
      index += 1;
    }
  }
  return args;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
