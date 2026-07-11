#!/usr/bin/env tsx

import path from 'node:path';

import { persistCandidateTenantDataVersion } from '../../src/lib/enterprise-data/candidate-version-store/candidate-tenant-data-version-store';

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
  const record = await persistCandidateTenantDataVersion({
    repoRoot,
    sourceProofBundlePath: path.normalize(args.get('source-proof') ?? 'audit-artifacts/tenant-packet-dry-run/minimal'),
    targetProofBundlePath: path.normalize(args.get('target-proof') ?? 'audit-artifacts/target-writer-dry-run/minimal'),
    moduleReadinessProofPath: path.normalize(args.get('module-proof') ?? 'reports/module-readiness-proof/minimal'),
    outputDir: path.normalize(args.get('out-dir') ?? 'reports/candidate-tenant-data-versions/minimal'),
  });

  console.log(JSON.stringify({
    candidateVersionKey: record.candidateVersionKey,
    currentStatus: record.currentStatus,
    dryRunOnly: record.dryRunOnly,
    writesPhysicalTables: record.writesPhysicalTables,
    activeTenantAccessLayerUpdated: record.activeTenantAccessLayerUpdated,
    moduleRuntimeConsumptionChanged: record.moduleRuntimeConsumptionChanged,
    promotionEnabled: record.promotionControl.promotionEnabled,
    proofBundleCount: record.proofBundles.length,
  }, null, 2));

  if (record.qualityGate.candidatePersistence !== 'pass') {
    throw new Error(`Candidate tenant data version persistence failed quality gates for ${record.candidateVersionKey}.`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
