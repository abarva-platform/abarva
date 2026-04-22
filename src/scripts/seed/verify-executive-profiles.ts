import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv } from './seed-wave-lib';

async function count(table: string): Promise<number> {
  const sb = createSeedClient();
  const { count: rowCount, error } = await sb.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return rowCount ?? 0;
}

async function countWhere(table: string, column: string, value: string): Promise<number> {
  const sb = createSeedClient();
  const { count: rowCount, error } = await sb
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);
  if (error) throw error;
  return rowCount ?? 0;
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  const [profileCount, compositeCount, careerCount, statementCount, personaCount] = await Promise.all([
    count('executive_profiles'),
    countWhere('executive_profiles', 'profile_type', 'composite_tenant'),
    count('executive_career_history'),
    count('executive_public_statements'),
    count('executive_demo_persona_overrides'),
  ]);

  const { data: scopedProfiles, error: scopedError } = await sb
    .from('executive_profiles')
    .select('id, full_name, reasoning_scope_id, disclosure_scope_id, person_id, client_id, metadata')
    .order('full_name');
  if (scopedError) throw scopedError;

  const missingScopes = ((scopedProfiles ?? []) as Array<{ full_name: string; reasoning_scope_id: string | null; disclosure_scope_id: string | null }>)
    .filter((row) => !row.reasoning_scope_id || !row.disclosure_scope_id)
    .map((row) => row.full_name);

  const missingPeople = ((scopedProfiles ?? []) as Array<{ full_name: string; person_id: string | null; client_id: string | null }>)
    .filter((row) => row.client_id && !row.person_id)
    .map((row) => row.full_name);

  const checks = [
    { label: 'executive profiles >= 4', passed: profileCount >= 4, actual: profileCount },
    { label: 'composite profiles = 4', passed: compositeCount === 4, actual: compositeCount },
    { label: 'career history rows >= 8', passed: careerCount >= 8, actual: careerCount },
    { label: 'public statements >= 4', passed: statementCount >= 4, actual: statementCount },
    { label: 'persona overrides = 4', passed: personaCount === 4, actual: personaCount },
    { label: 'all composite profiles scoped', passed: missingScopes.length === 0, actual: missingScopes.length },
    { label: 'all composite profiles linked to persons', passed: missingPeople.length === 0, actual: missingPeople.length },
  ];

  console.log('\nExecutive profile verification');
  for (const check of checks) {
    console.log(`  ${check.passed ? 'PASS' : 'FAIL'} · ${check.label} · ${check.actual}`);
  }

  if (missingScopes.length > 0) {
    console.log(`  missing scopes      · ${missingScopes.join(' · ')}`);
  }
  if (missingPeople.length > 0) {
    console.log(`  missing person ids  · ${missingPeople.join(' · ')}`);
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
