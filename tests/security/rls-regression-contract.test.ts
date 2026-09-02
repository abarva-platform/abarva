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

  it('reports missing canonical tenant setup as not checked instead of as a leak verdict', () => {
    expect(sql).toContain('Canonical tenant(s) % missing from clients table');
    expect(runner).toContain('isNotCheckedPrecondition');
    expect(runner).toContain('rls-regression: NOT CHECKED');
    expect(runner).toContain('RLS regression expected tenants were not supplied');
    expect(workflow).toContain('rls-regression: NOT CHECKED');
    expect(workflow.indexOf('rls-regression: NOT CHECKED')).toBeLessThan(
      workflow.indexOf('rls-regression: FAILED'),
    );
  });
});
