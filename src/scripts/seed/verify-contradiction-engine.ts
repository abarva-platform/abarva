import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SEEDED_CONTRADICTION_EXAMPLES } from './contradiction-engine-data';
import { contradictionScopeId, createContradictionSeedClient, deterministicUuid } from './contradiction-engine-lib';
import { TENANTS, type TenantKey } from './seed-wave-lib';

async function countWhere(
  table: string,
  filters: Array<{ column: string; value: unknown }> = [],
): Promise<number> {
  const sb = await createContradictionSeedClient();
  let query = sb.from(table).select('id', { count: 'exact', head: true });
  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countContradictionsWithMissingScopes(): Promise<number> {
  const sb = await createContradictionSeedClient();
  const { data, error } = await sb
    .from('contradictions')
    .select('id, reasoning_scope_id, disclosure_scope_id')
    .not('detection_rule_id', 'is', null);
  if (error) throw error;
  return ((data ?? []) as Array<{ reasoning_scope_id: string | null; disclosure_scope_id: string | null }>)
    .filter((row) => !row.reasoning_scope_id || !row.disclosure_scope_id)
    .length;
}

async function countSeededContradictions(): Promise<number> {
  const sb = await createContradictionSeedClient();
  const expectedIds = new Set(
    SEEDED_CONTRADICTION_EXAMPLES.map((row) =>
      deterministicUuid(`contradiction:${row.tenant}:${row.detectionRuleId}:${row.shortTitle}`),
    ),
  );
  const { data, error } = await sb
    .from('contradictions')
    .select('id');
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string }>)
    .filter((row) => expectedIds.has(row.id))
    .length;
}

async function countSeededEvidenceRows(): Promise<number> {
  const sb = await createContradictionSeedClient();
  const expectedIds = new Set(
    SEEDED_CONTRADICTION_EXAMPLES.flatMap((row) =>
      row.evidence.map(
        (_evidence, index) => `contradiction_evidence_${row.tenant}_${row.detectionRuleId.toLowerCase()}_${index + 1}`,
      ),
    ),
  );
  const { data, error } = await sb
    .from('evidence')
    .select('id');
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string }>)
    .filter((row) => expectedIds.has(row.id))
    .length;
}

async function countContradictionScopes(): Promise<number> {
  const sb = await createContradictionSeedClient();
  const expectedIds = new Set(
    (Object.keys(TENANTS) as TenantKey[]).flatMap((tenant) => [
      contradictionScopeId(tenant, 'reasoning_broad'),
      contradictionScopeId(tenant, 'program_leadership'),
      contradictionScopeId(tenant, 'executive_sponsor'),
      contradictionScopeId(tenant, 'reasoning_only'),
    ]),
  );
  const { data, error } = await sb.from('access_scopes').select('id');
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string }>)
    .filter((row) => expectedIds.has(row.id))
    .length;
}

async function countEvidenceLinks(): Promise<number> {
  const sb = await createContradictionSeedClient();
  const { data, error } = await sb.from('contradiction_evidence').select('id');
  if (error) throw error;
  const expectedIds = new Set(
    SEEDED_CONTRADICTION_EXAMPLES.flatMap((row) =>
      row.evidence.map((_evidence, index) =>
        deterministicUuid(`contradiction-link:${row.tenant}:${row.detectionRuleId}:${row.shortTitle}:${index}`),
      ),
    ),
  );
  return ((data ?? []) as Array<{ id: string }>).filter((row) => expectedIds.has(row.id)).length;
}

async function countByCategory(category: string): Promise<number> {
  return SEEDED_CONTRADICTION_EXAMPLES.filter((row) => row.category === category).length;
}

async function countSeededRuns(): Promise<number> {
  const sb = await createContradictionSeedClient();
  const expectedIds = new Set(
    SEEDED_CONTRADICTION_EXAMPLES.map((row) =>
      deterministicUuid(`contradiction-run:${row.tenant}:${row.detectionRuleId}:${row.shortTitle}`),
    ),
  );
  const { data, error } = await sb.from('contradiction_detection_runs').select('id');
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string }>).filter((row) => expectedIds.has(row.id)).length;
}

async function main() {
  const [
    contradictionScopeCount,
    ruleCount,
    runCount,
    contradictionCount,
    evidenceCount,
    evidenceLinkCount,
    categoryACount,
    categoryBCount,
    categoryCCount,
    categoryDCount,
    categoryECount,
    missingScopes,
  ] = await Promise.all([
    countContradictionScopes(),
    countWhere('contradiction_detection_rules'),
    countSeededRuns(),
    countSeededContradictions(),
    countSeededEvidenceRows(),
    countEvidenceLinks(),
    countByCategory('A_strategy_allocation'),
    countByCategory('B_commitment_pace'),
    countByCategory('C_sponsor_behavior'),
    countByCategory('D_budget_priority'),
    countByCategory('E_external_internal_messaging'),
    countContradictionsWithMissingScopes(),
  ]);

  const checks = [
    { label: 'contradiction access scopes = 16', passed: contradictionScopeCount === 16, actual: contradictionScopeCount },
    { label: 'detection rules = 15', passed: ruleCount === 15, actual: ruleCount },
    { label: 'detection runs = 20', passed: runCount === 20, actual: runCount },
    { label: 'seeded contradictions = 20', passed: contradictionCount === 20, actual: contradictionCount },
    { label: 'seeded evidence = 46', passed: evidenceCount === 46, actual: evidenceCount },
    { label: 'contradiction evidence links = 46', passed: evidenceLinkCount === 46, actual: evidenceLinkCount },
    { label: 'category A rows = 4', passed: categoryACount === 4, actual: categoryACount },
    { label: 'category B rows = 4', passed: categoryBCount === 4, actual: categoryBCount },
    { label: 'category C rows = 4', passed: categoryCCount === 4, actual: categoryCCount },
    { label: 'category D rows = 4', passed: categoryDCount === 4, actual: categoryDCount },
    { label: 'category E rows = 4', passed: categoryECount === 4, actual: categoryECount },
    { label: 'all seeded contradictions scoped', passed: missingScopes === 0, actual: missingScopes },
  ];

  console.log('\nContradiction engine verification');
  for (const check of checks) {
    console.log(`  ${check.passed ? 'PASS' : 'FAIL'} - ${check.label} - ${check.actual}`);
  }

  const failed = checks.filter((check) => !check.passed);
  if (failed.length > 0) {
    throw new Error(`Verification failed: ${failed.map((check) => check.label).join('; ')}`);
  }
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
