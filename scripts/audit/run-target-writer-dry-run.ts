#!/usr/bin/env tsx

import path from 'node:path';

import { runTargetWriterDryRun } from '../../src/lib/enterprise-data/target-writer/target-writer-dry-run';

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
  const result = await runTargetWriterDryRun({
    repoRoot,
    sourceProofBundlePath: path.normalize(args.get('source-proof') ?? 'audit-artifacts/tenant-packet-dry-run/minimal'),
    outputDir: path.normalize(args.get('out-dir') ?? 'audit-artifacts/target-writer-dry-run/minimal'),
  });

  console.log(JSON.stringify(result.summary, null, 2));

  if (result.summary.qualityGateStatus !== 'pass') {
    throw new Error(`Target writer dry-run failed quality gates. Proof bundle: ${result.summary.targetProofBundlePath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
