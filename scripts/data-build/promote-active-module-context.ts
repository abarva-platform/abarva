#!/usr/bin/env tsx

import {
  buildActiveModuleContextPromotion,
} from "../../src/lib/enterprise-data/active-module-context-promotion/active-module-context-promotion";

interface Args {
  tenantKey?: string;
  slug?: string;
  generatedAt?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.tenantKey || !args.slug) {
    throw new Error("Usage: npm run audit:active-module-context-promotion -- --tenant <tenant-key> --slug <output-slug>");
  }
  const report = await buildActiveModuleContextPromotion({
    repoRoot: process.cwd(),
    tenantKey: args.tenantKey,
    outputSlug: args.slug,
    generatedAt: args.generatedAt,
  });
  console.log(
    JSON.stringify(
      {
        reportVersion: report.reportVersion,
        tenantKey: report.tenantKey,
        candidateVersionId: report.candidateVersionId,
        activeVersionId: report.activeAccessRecord.activeVersionId,
        outputDir: report.outputPaths.outputDir,
        guardrails: report.guardrails,
        moduleReadProof: report.moduleReadProof,
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
    if (arg === "--tenant" && next) {
      args.tenantKey = next;
      index += 1;
    } else if (arg === "--slug" && next) {
      args.slug = next;
      index += 1;
    } else if (arg === "--generated-at" && next) {
      args.generatedAt = next;
      index += 1;
    }
  }
  return args;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
