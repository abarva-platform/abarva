#!/usr/bin/env tsx

import path from 'node:path';

import { evaluateCandidatePromotionGate } from '../../src/lib/enterprise-data/candidate-promotion-gate/candidate-promotion-gate';

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
  const result = await evaluateCandidatePromotionGate({
    repoRoot,
    candidateRecordPath: path.normalize(
      args.get('candidate-record') ?? 'reports/candidate-tenant-data-versions/minimal/candidate-version-record.json',
    ),
    outputDir: path.normalize(args.get('out-dir') ?? 'reports/candidate-promotion-gates/minimal'),
    priorActiveVersionId: args.get('prior-active-version') ?? null,
  });
  const decision = result.decisionRecord;

  console.log(JSON.stringify({
    candidateVersionKey: decision.candidateVersionKey,
    decision: decision.decision,
    promotionEnabled: decision.promotionEnabled,
    operatorApprovalRequired: decision.operatorApprovalRequired,
    rollbackPlanRequired: decision.rollbackPlanRequired,
    activeTenantAccessLayerUpdated: decision.activeTenantAccessLayerUpdated,
    writesPhysicalTables: decision.writesPhysicalTables,
    moduleRuntimeConsumptionChanged: decision.moduleRuntimeConsumptionChanged,
    activePromotionAttempted: decision.activePromotionAttempted,
    passedChecks: decision.passedChecks.length,
    failedChecks: decision.failedChecks.length,
    blockers: decision.blockers.length,
  }, null, 2));

  if (decision.failedChecks.length > 0 || decision.decision === 'blocked') {
    throw new Error(`Candidate promotion gate blocked ${decision.candidateVersionKey}.`);
  }
  if (
    decision.promotionEnabled
    || decision.activeTenantAccessLayerUpdated
    || decision.writesPhysicalTables
    || decision.moduleRuntimeConsumptionChanged
    || decision.activePromotionAttempted
  ) {
    throw new Error('Candidate promotion gate violated the non-destructive PR9 guardrail.');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
