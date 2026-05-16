// Outcome ledger · Wave 3, Slice 3.1 · migration dry-run / contract test.
//
// Reads the migration SQL off disk and asserts the schema contract the
// view model and read adapter depend on. No DB connection — this is the
// dry-run safety check called for in the execution plan's QA gate for
// persistence PRs (RLS impact + idempotency).

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION_PATH = path.join(
  process.cwd(),
  'supabase/migrations/20260516180000_outcome_ledger.sql',
);

const sql = readFileSync(MIGRATION_PATH, 'utf8');

/** Whitespace-collapsed view, for column-definition assertions. */
const collapsed = sql.replace(/[ \t]+/g, ' ');

describe('outcome_ledger migration · structure', () => {
  it('creates the outcome_ledger table idempotently', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS outcome_ledger');
  });

  it('is wrapped in a BEGIN/COMMIT transaction', () => {
    expect(sql).toContain('BEGIN;');
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true);
    // BEGIN precedes the CREATE TABLE, COMMIT follows it.
    expect(sql.indexOf('BEGIN;')).toBeLessThan(
      sql.indexOf('CREATE TABLE IF NOT EXISTS outcome_ledger'),
    );
  });

  it('keys the ledger by tenant and a Move/Source-event reference', () => {
    expect(collapsed).toContain('tenant_client_key TEXT NOT NULL');
    expect(sql).toContain('subject_kind');
    expect(sql).toContain('subject_ref');
    expect(sql).toContain(
      "CHECK (subject_kind IN ('move', 'source_event', 'use_case', 'program'))",
    );
  });

  it('records the value rung, amount, and evidence link', () => {
    expect(sql).toContain('value_rung');
    expect(collapsed).toContain('projected_amount NUMERIC NOT NULL');
    expect(collapsed).toContain('realized_amount NUMERIC');
    expect(sql).toContain('evidence_pointer');
    expect(sql).toContain('evidence_claim_ids');
  });

  it('constrains value_rung to the canonical readiness ladder', () => {
    for (const rung of [
      'projected_only',
      'baseline_pending',
      'baseline_set',
      'in_pilot_measurement',
      'measured_in_pilot',
      'measured_in_production',
      'declined',
    ]) {
      expect(sql).toContain(`'${rung}'`);
    }
  });

  it('supports append-only history via supersedes_entry_id + is_current', () => {
    expect(collapsed).toContain(
      'supersedes_entry_id UUID REFERENCES outcome_ledger(id)',
    );
    expect(collapsed).toContain('is_current BOOLEAN NOT NULL DEFAULT TRUE');
  });
});

describe('outcome_ledger migration · RLS', () => {
  it('ENABLEs row level security on the table', () => {
    expect(sql).toContain('ALTER TABLE outcome_ledger ENABLE ROW LEVEL SECURITY');
  });

  it('adds a tenant-scoped read policy via can_read_tenant_by_key', () => {
    expect(sql).toContain('CREATE POLICY auth_read ON outcome_ledger');
    expect(sql).toContain('can_read_tenant_by_key(tenant_client_key)');
  });

  it('grants SELECT to authenticated and full access to service_role only', () => {
    expect(sql).toContain('GRANT SELECT ON outcome_ledger TO authenticated');
    expect(sql).toContain('CREATE POLICY svc_all ON outcome_ledger');
    // No public-role insert path.
    expect(sql).not.toContain('TO public');
    expect(sql).not.toContain('TO anon');
  });
});

describe('outcome_ledger migration · safety (dry-run)', () => {
  it('contains no destructive patterns', () => {
    expect(scanForDestructivePatterns(
      '20260516180000_outcome_ledger.sql',
      sql,
    )).toEqual([]);
  });

  it('declares the supporting indexes idempotently', () => {
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_outcome_ledger_tenant_current');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_outcome_ledger_subject');
  });
});
