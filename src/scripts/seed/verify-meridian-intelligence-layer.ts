import { pathToFileURL } from 'node:url';
import { loadMeridianOverlay } from './meridian-intelligence-layer-lib';
import { createSeedClient, loadSeedEnv, TENANTS } from './seed-wave-lib';

async function resolveMeridianClientId(): Promise<string> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: TENANTS.meridian.shortName },
    { column: 'name', value: TENANTS.meridian.canonicalName },
    { column: 'legal_name', value: TENANTS.meridian.legalName },
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
  throw new Error('Meridian client not found');
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

async function countTelemetryWithCompliance(clientId: string): Promise<number> {
  const sb = createSeedClient();
  const { data, error } = await sb
    .from('telemetry_sources')
    .select('id, compliance_tags')
    .eq('client_id', clientId);
  if (error) throw error;
  return ((data ?? []) as Array<{ compliance_tags: string[] | null }>)
    .filter((row) => Array.isArray(row.compliance_tags) && row.compliance_tags.length > 0)
    .length;
}

async function main() {
  loadSeedEnv();
  const clientId = await resolveMeridianClientId();
  const overlay = loadMeridianOverlay();

  const [
    scopeCount,
    cohortCount,
    sourceCount,
    eventCount,
    kpiCount,
    patternCount,
    telemetryCount,
    evidenceCount,
    kpiMissingScopes,
    patternMissingScopes,
    telemetryMissingScopes,
    telemetryWithCompliance,
  ] = await Promise.all([
    count('access_scopes', clientId),
    count('benchmark_cohorts', clientId),
    count('external_sources', clientId),
    count('external_events', clientId),
    count('kpis', clientId),
    count('pattern_packs', clientId),
    count('telemetry_sources', clientId),
    count('evidence', clientId),
    countMissingScopes('kpis', clientId),
    countMissingScopes('pattern_packs', clientId),
    countMissingScopes('telemetry_sources', clientId),
    countTelemetryWithCompliance(clientId),
  ]);

  const checks = [
    { label: `access scopes = ${overlay.accessScopes.length}`, passed: scopeCount === overlay.accessScopes.length, actual: scopeCount },
    { label: `benchmark cohorts = ${overlay.benchmarkCohorts.length}`, passed: cohortCount === overlay.benchmarkCohorts.length, actual: cohortCount },
    { label: `external sources = ${overlay.externalSources.length}`, passed: sourceCount === overlay.externalSources.length, actual: sourceCount },
    { label: `external events = ${overlay.externalEvents.length}`, passed: eventCount === overlay.externalEvents.length, actual: eventCount },
    { label: `kpis = ${overlay.kpis.length}`, passed: kpiCount === overlay.kpis.length, actual: kpiCount },
    { label: `pattern packs = ${overlay.patternPacks.length}`, passed: patternCount === overlay.patternPacks.length, actual: patternCount },
    { label: `telemetry sources = ${overlay.telemetrySources.length}`, passed: telemetryCount === overlay.telemetrySources.length, actual: telemetryCount },
    { label: `evidence = ${overlay.evidence.length}`, passed: evidenceCount === overlay.evidence.length, actual: evidenceCount },
    { label: 'kpis all scoped', passed: kpiMissingScopes === 0, actual: kpiMissingScopes },
    { label: 'patterns all scoped', passed: patternMissingScopes === 0, actual: patternMissingScopes },
    { label: 'telemetry all scoped', passed: telemetryMissingScopes === 0, actual: telemetryMissingScopes },
    { label: `telemetry rows with compliance tags = ${overlay.telemetrySources.length}`, passed: telemetryWithCompliance === overlay.telemetrySources.length, actual: telemetryWithCompliance },
  ];

  console.log('\nMeridian intelligence layer verification');
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
