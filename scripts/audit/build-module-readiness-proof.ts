#!/usr/bin/env tsx

import path from 'node:path';

import { buildModuleReadinessProof } from '../../src/lib/enterprise-data/proof-harness/module-readiness-proof';

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
  const proof = await buildModuleReadinessProof({
    repoRoot,
    sourceProofBundlePath: path.normalize(args.get('source-proof') ?? 'audit-artifacts/tenant-packet-dry-run/minimal'),
    targetProofBundlePath: path.normalize(args.get('target-proof') ?? 'audit-artifacts/target-writer-dry-run/minimal'),
    outputDir: path.normalize(args.get('out-dir') ?? 'reports/module-readiness-proof/minimal'),
  });

  console.log(JSON.stringify(proof.summary, null, 2));

  if (proof.summary.qualityGateStatus !== 'pass') {
    throw new Error(`Module readiness proof failed quality gates for ${proof.summary.packetId}.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
