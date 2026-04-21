import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  TENANTS,
  type TenantConfig,
  loadSeedEnv,
  createSeedClient,
} from './seed-wave-lib';

interface ClientRow {
  id: string;
  name: string;
  legal_name: string | null;
}

async function resolveClient(tenant: TenantConfig): Promise<ClientRow> {
  const sb = createSeedClient();
  for (const field of [
    { column: 'name', value: tenant.shortName },
    { column: 'name', value: tenant.canonicalName },
    { column: 'legal_name', value: tenant.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, legal_name')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error(`Client not found for ${tenant.canonicalName}`);
}

async function verifyTenant(tenant: TenantConfig): Promise<void> {
  const sb = createSeedClient();
  const client = await resolveClient(tenant);

  const [{ data: vipRows, error: vipError }, { data: orgRows, error: orgError }, benchmarkResult] = await Promise.all([
    sb.from('vip_profiles').select('display_name, person_id, current_company').eq('current_company', tenant.canonicalName),
    sb.from('org_master_data').select('category, content').eq('org_id', client.id),
    sb.from('benchmark_history').select('metric_name, source').eq('client_id', client.id),
  ]);

  if (vipError) throw vipError;
  if (orgError) throw orgError;
  if (benchmarkResult.error && !isMissingTableError(benchmarkResult.error)) throw benchmarkResult.error;

  const orgByCategory = new Map(((orgRows ?? []) as Array<{ category: string; content: Record<string, unknown> }>).map((row) => [row.category, row.content]));
  const requiredCategories = [
    'role_taxonomy',
    'org_units',
    'people_roster',
    'reporting_relationships',
    'vip_profiles',
    'strategic_priorities',
    'active_initiatives',
    'vendor_landscape',
    'active_patterns',
    'benchmark_data',
    'prior_program_history',
  ];

  const missingCategories = requiredCategories.filter((category) => !orgByCategory.has(category));
  if (missingCategories.length > 0) {
    throw new Error(`${tenant.canonicalName}: missing org_master_data categories ${missingCategories.join(', ')}`);
  }

  const unresolvedVip = ((vipRows ?? []) as Array<{ display_name: string; person_id: string | null }>).filter((row) => !row.person_id);
  if (unresolvedVip.length > 0) {
    throw new Error(`${tenant.canonicalName}: unresolved VIP person links for ${unresolvedVip.map((row) => row.display_name).join(', ')}`);
  }

  const initiatives = (((orgByCategory.get('active_initiatives') as { initiatives?: Array<{ title: string; sponsorLine?: string | null }> } | undefined)?.initiatives) ?? []);
  const initiativesMissingSponsor = initiatives.filter((initiative) => !initiative.sponsorLine);
  if (initiativesMissingSponsor.length > 0) {
    throw new Error(`${tenant.canonicalName}: initiatives missing sponsors ${initiativesMissingSponsor.map((item) => item.title).join(', ')}`);
  }

  const patterns = (((orgByCategory.get('active_patterns') as { patterns?: Array<{ title: string; evidence?: string[] }> } | undefined)?.patterns) ?? []);
  const patternsMissingEvidence = patterns.filter((pattern) => !pattern.evidence || pattern.evidence.length === 0);
  if (patternsMissingEvidence.length > 0) {
    throw new Error(`${tenant.canonicalName}: patterns missing evidence ${patternsMissingEvidence.map((item) => item.title).join(', ')}`);
  }

  const benchmarkRows = (benchmarkResult.data ?? []) as Array<{ metric_name: string; source: string | null }>;
  if (benchmarkRows.length > 0) {
    const benchmarksMissingSource = benchmarkRows.filter((row) => !row.source);
    if (benchmarksMissingSource.length > 0) {
      throw new Error(`${tenant.canonicalName}: benchmarks missing sources ${benchmarksMissingSource.map((row) => row.metric_name).join(', ')}`);
    }
  } else {
    const benchmarkData = ((orgByCategory.get('benchmark_data') as { benchmarks?: Array<{ title: string; sourceAttribution?: string[] }> } | undefined)?.benchmarks) ?? [];
    const missingAttribution = benchmarkData.filter((benchmark) => !benchmark.sourceAttribution || benchmark.sourceAttribution.length === 0);
    if (missingAttribution.length > 0) {
      throw new Error(`${tenant.canonicalName}: org benchmark entries missing attribution ${missingAttribution.map((row) => row.title).join(', ')}`);
    }
  }

  console.log(`\n${tenant.canonicalName}`);
  console.log(`  vip profiles resolved  · ${((vipRows ?? []) as unknown[]).length}`);
  console.log(`  initiatives w sponsor  · ${initiatives.length}`);
  console.log(`  patterns w evidence    · ${patterns.length}`);
  console.log(`  benchmark rows sourced · ${benchmarkRows.length}`);
  console.log(`  categories present     · ${requiredCategories.length}`);
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' || /Could not find the table/i.test(error.message ?? '');
}

async function main() {
  loadSeedEnv();
  for (const tenant of Object.values(TENANTS)) {
    await verifyTenant(tenant);
  }
  console.log('\nSeed wave verification passed.');
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
