#!/usr/bin/env tsx

import { generateTenantCandidateVersion } from '../../src/lib/enterprise-data/candidate-generation/tenant-candidate-version-generator';

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
  const result = await generateTenantCandidateVersion({
    repoRoot,
    tenantKey: args.get('tenant') ?? 'skyharbor-air',
    generatedAt: args.get('generated-at'),
  });
  const selectedSummary = result.selectedTenantSummary;

  console.log(JSON.stringify({
    selectedTenant: result.selectedTenant,
    selectedTenantStatus: selectedSummary?.candidateGenerationStatus ?? 'inventory_only',
    tenantsInventoried: result.allTenantEligibilityMatrix.length,
    tenantMatrixPath: 'reports/tenant-candidate-generation/all-tenant-eligibility-matrix.json',
    candidateVersionKey: selectedSummary?.lineage.candidateVersionKey,
    promotionGateDecision: selectedSummary?.lineage.promotionGateDecision,
    dryRunOnly: selectedSummary?.dryRunOnly ?? true,
    writesPhysicalTables: selectedSummary?.writesPhysicalTables ?? false,
    activeTenantAccessLayerUpdated: selectedSummary?.activeTenantAccessLayerUpdated ?? false,
    moduleRuntimeConsumptionChanged: selectedSummary?.moduleRuntimeConsumptionChanged ?? false,
    candidatePromoted: selectedSummary?.candidatePromoted ?? false,
    blockers: selectedSummary?.blockers ?? [],
  }, null, 2));

  if (selectedSummary?.candidateGenerationStatus === 'blocked') {
    throw new Error(`Tenant candidate generation blocked for ${selectedSummary.tenant}: ${selectedSummary.blockers.join('; ')}`);
  }
  if (
    selectedSummary
    && (
      !selectedSummary.dryRunOnly
      || selectedSummary.writesPhysicalTables
      || selectedSummary.activeTenantAccessLayerUpdated
      || selectedSummary.moduleRuntimeConsumptionChanged
      || selectedSummary.candidatePromoted
    )
  ) {
    throw new Error('Tenant candidate generation violated the non-destructive PR10 guardrail.');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
