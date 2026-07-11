#!/usr/bin/env tsx

import path from 'node:path';

import { buildStrandedIntelligenceReport } from '../../src/lib/enterprise-data/stranded-intelligence/stranded-intelligence-report';

const repoRoot = process.cwd();
const args = new Map<string, string>();

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const nextValue = process.argv[index + 1];
  if (nextValue && !nextValue.startsWith('--')) {
    args.set(key, nextValue);
    index += 1;
  } else {
    args.set(key, 'true');
  }
}

async function main(): Promise<void> {
  const report = await buildStrandedIntelligenceReport({
    repoRoot,
    sourceProofBundlePath: path.normalize(args.get('source-proof') ?? 'audit-artifacts/tenant-packet-dry-run/minimal'),
    targetProofBundlePath: path.normalize(args.get('target-proof') ?? 'audit-artifacts/target-writer-dry-run/minimal'),
    outputDir: path.normalize(args.get('out-dir') ?? 'reports/stranded-intelligence/minimal'),
  });

  console.log(JSON.stringify(report.summary, null, 2));

  if (report.summary.qualityGateStatus !== 'pass') {
    throw new Error(`Stranded intelligence report failed quality gates for ${report.summary.packetId}.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
