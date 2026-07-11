#!/usr/bin/env tsx

import path from 'node:path';

import { buildSkyHarborCompatibilitySnapshot } from '../../src/lib/enterprise-data/compatibility/skyharbor-compatibility-snapshot';

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
  const snapshot = await buildSkyHarborCompatibilitySnapshot({
    repoRoot,
    sourceRoot: path.normalize(args.get('source-root') ?? 'datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710'),
    outputDir: path.normalize(args.get('out-dir') ?? 'reports/skyharbor-compatibility-snapshot'),
  });

  console.log(JSON.stringify(snapshot.summary, null, 2));

  if (snapshot.summary.qualityGateStatus !== 'pass') {
    throw new Error(`SkyHarbor compatibility snapshot failed quality gates for ${snapshot.summary.datasetId}.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
