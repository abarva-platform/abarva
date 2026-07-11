#!/usr/bin/env tsx

import path from 'node:path';

import { runTenantPacketDryRun } from '../../src/lib/enterprise-data/dry-run/tenant-packet-dry-run';

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

const manifestPath = path.resolve(
  repoRoot,
  args.get('manifest') ?? 'fixtures/tenant-packets/minimal/tenant-manifest.example.yaml',
);
const outputDir = args.get('out-dir') ?? 'audit-artifacts/tenant-packet-dry-run/minimal';

async function main(): Promise<void> {
  const result = await runTenantPacketDryRun({
    repoRoot,
    manifestPath,
    outputDir,
  });

  console.log(JSON.stringify(result.summary, null, 2));

  if (result.summary.qualityGateStatus !== 'pass') {
    throw new Error(`Tenant packet dry-run failed quality gates. Proof bundle: ${result.summary.proofBundlePath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
