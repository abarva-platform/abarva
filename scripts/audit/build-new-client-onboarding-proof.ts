#!/usr/bin/env tsx

import path from "node:path";

import { buildNewClientOnboardingProof } from "../../src/lib/enterprise-data/new-client-onboarding-proof/new-client-onboarding-proof";

interface Args {
  outputDir?: string;
  generatedAt?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildNewClientOnboardingProof({
    repoRoot: process.cwd(),
    outputDir: args.outputDir,
    generatedAt: args.generatedAt,
  });

  console.log(
    JSON.stringify(
      {
        status: report.qualityGateStatus,
        reportVersion: report.reportVersion,
        requiredInputFileClasses:
          report.pilotContract.requiredInputFiles.length,
        optionalAccelerationFileClasses:
          report.pilotContract.optionalAccelerationFiles.length,
        onboardingWorkflowSteps: report.onboardingWorkflow.length,
        targetLayers: report.targetDataLayer.length,
        outputDir: path.dirname(report.outputPaths.jsonPath),
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
