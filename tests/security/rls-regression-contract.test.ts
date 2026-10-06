import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.resolve(process.cwd(), 'tests/security/rls-regression.sql'),
  'utf8',
);
const runner = readFileSync(
  path.resolve(process.cwd(), 'scripts/run-rls-regression.ts'),
  'utf8',
);
const workflow = readFileSync(
  path.resolve(process.cwd(), '.github/workflows/rls-regression.yml'),
  'utf8',
);
// C-632 moved the precondition classifier out of the runner so a test could
// drive it rather than grep it. The runner now imports from here.
const classifier = readFileSync(
  path.resolve(process.cwd(), 'src/lib/security/rls-precondition-classification.ts'),
  'utf8',
);

describe('RLS regression SQL contract', () => {
  it('derives probe tenants from the canonical code constant instead of a SQL alias list', () => {
    expect(runner).toContain('CANONICAL_TENANT_KEYS');
    expect(runner).toContain('CREATE TEMP TABLE rls_regression_expected_tenants');
    expect(runner).toContain('SELECT unnest($1::text[])');
    expect(sql).toContain('rls_regression_expected_tenants');
    expect(sql).toContain('CANONICAL_TENANT_KEYS');
    expect(sql).toContain('resolved to an empty set');
    expect(sql).not.toContain("('apex-retail')");
    expect(sql).not.toContain("('meridian-health')");
    expect(sql).not.toContain("('first-capital')");
    expect(sql).not.toContain('FROM (VALUES');
  });

  it('classifies known service-role-only tables without hiding unexpected permission errors', () => {
    expect(sql).toContain('rls_regression_service_role_only_tables');
    expect(sql).toContain("EXCEPTION WHEN insufficient_privilege THEN");
    expect(sql).toContain("WHEN OTHERS THEN\n        INSERT INTO rls_regression_findings");
    expect(sql).not.toContain("EXCEPTION WHEN OTHERS THEN\n        INSERT INTO rls_regression_findings");
    expect(sql).toContain("'service_role_only'");
    expect(sql).toContain("'error: ' || SQLERRM");
  });

  it('pins the current service-role-only table catalogue used by production RLS probes', () => {
    const tables = Array.from(sql.matchAll(/\('([^']+)'\)/g)).map((match) => match[1]);
    expect(tables).toEqual(
      expect.arrayContaining([
        'data_segment_enterprise_profile',
        'enterprise_context_chunks',
        'instrument_templates',
        'platform_notification_events',
        'tower_cloud_cost',
        'tower_program_financials',
      ]),
    );
  });

  // C-632. This case used to pin the sentence
  // 'Canonical tenant(s) % missing from clients table', which the suite no
  // longer raises. That sentence asserted a cause the precondition had not
  // established -- it had observed only that THIS CONNECTION saw no row, and
  // public.clients carries row-level security scoped to service_role, so a row
  // that exists is invisible to a connecting role outside that policy. The
  // sentence named the absent cause and prescribed a migration against a shared
  // control database that may already be correct.
  //
  // The pin is updated rather than dropped, and deliberately kept thin: whether
  // the suite can tell the two causes apart is a behaviour, and a string in this
  // file cannot show it. That proof is
  // tests/security/test_rls_precondition_cause.ts, which drives the shipped SQL
  // against a disposable Postgres over a pair of databases the connecting role
  // cannot distinguish by looking, plus
  // src/__tests__/behaviors/rls-precondition-classification.test.ts for the
  // runner's half.
  it('reports an unmet canonical tenant precondition as not checked instead of as a leak verdict', () => {
    expect(sql).toContain('rls-regression precondition: canonical tenant rows unresolved');
    expect(runner).toContain('isNotCheckedPrecondition');
    expect(runner).toContain('rls-regression: NOT CHECKED');
    // The suite raises it; the classifier is what recognises it.
    expect(sql).toContain('RLS regression expected tenants were not supplied');
    expect(classifier).toContain('RLS regression expected tenants were not supplied');
    expect(workflow).toContain('rls-regression: NOT CHECKED');
    expect(workflow.indexOf('rls-regression: NOT CHECKED')).toBeLessThan(
      workflow.indexOf('rls-regression: FAILED'),
    );
  });

  it('keeps the precondition a refusal, so a suite that probed nothing cannot report a pass', () => {
    // Narrow on purpose: the behavioural proof that each cause still raises is
    // in tests/security/test_rls_precondition_cause.ts. This only holds the
    // shipped suite to raising rather than warning at that site.
    const block = sql.slice(
      sql.indexOf('DO $verify_tenants$'),
      sql.indexOf('$verify_tenants$;', sql.indexOf('DO $verify_tenants$')),
    );
    expect(block).not.toEqual('');
    expect(block).toContain('RAISE EXCEPTION');
    expect(block).not.toContain('RAISE WARNING');
  });
});
