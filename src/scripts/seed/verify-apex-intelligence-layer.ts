import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

async function resolveApexClientId(): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: TENANTS.apex.shortName },
    { column: 'name', value: TENANTS.apex.canonicalName },
    { column: 'legal_name', value: TENANTS.apex.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return (data as { id: string }).id;
  }
  throw new Error('Apex client not found');
}

async function count(table: string, clientId: string): Promise<number> {
  const sb = createSeedClient();
  const { count: rowCount, error } = await sb
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);
  if (error) throw error;
  return rowCount ?? 0;
}

async function countMissingScopes(table: string, clientId: string): Promise<number> {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from(table)
    .select('id, reasoning_scope_id, disclosure_scope_id')
    .eq('client_id', clientId);
  if (error) throw error;
  return ((data ?? []) as Array<{ reasoning_scope_id: string | null; disclosure_scope_id: string | null }>)
    .filter((row) => !row.reasoning_scope_id || !row.disclosure_scope_id)
    .length;
}

async function main() {
  loadSeedEnv();
  const clientId = await resolveApexClientId();

  const [scopeCount, cohortCount, sourceCount, eventCount, kpiCount, patternCount, telemetryCount, evidenceCount] = await Promise.all([
    count('access_scopes', clientId),
    count('benchmark_cohorts', clientId),
    count('external_sources', clientId),
    count('external_events', clientId),
    count('kpis', clientId),
    count('pattern_packs', clientId),
    count('telemetry_sources', clientId),
    count('evidence', clientId),
  ]);

  const [kpiMissingScopes, patternMissingScopes, telemetryMissingScopes] = await Promise.all([
    countMissingScopes('kpis', clientId),
    countMissingScopes('pattern_packs', clientId),
    countMissingScopes('telemetry_sources', clientId),
  ]);

  const checks = [
    { label: 'access scopes >= 6', passed: scopeCount >= 6, actual: scopeCount },
    { label: 'benchmark cohorts >= 3', passed: cohortCount >= 3, actual: cohortCount },
    { label: 'external sources >= 8', passed: sourceCount >= 8, actual: sourceCount },
    { label: 'external events >= 6', passed: eventCount >= 6, actual: eventCount },
    { label: 'kpis >= 39', passed: kpiCount >= 39, actual: kpiCount },
    { label: 'pattern packs = 7', passed: patternCount === 7, actual: patternCount },
    { label: 'telemetry sources = 9', passed: telemetryCount === 9, actual: telemetryCount },
    { label: 'evidence >= 61', passed: evidenceCount >= 61, actual: evidenceCount },
    { label: 'kpis all scoped', passed: kpiMissingScopes === 0, actual: kpiMissingScopes },
    { label: 'patterns all scoped', passed: patternMissingScopes === 0, actual: patternMissingScopes },
    { label: 'telemetry all scoped', passed: telemetryMissingScopes === 0, actual: telemetryMissingScopes },
  ];

  console.log('\nApex intelligence layer verification');
  for (const check of checks) {
    console.log(`  ${check.passed ? 'PASS' : 'FAIL'} · ${check.label} · ${check.actual}`);
  }

  const failed = checks.filter((check) => !check.passed);
  if (failed.length > 0) {
    throw new Error(`Verification failed: ${failed.map((item) => item.label).join('; ')}`);
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
