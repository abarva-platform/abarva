// Sourcing work-items · migration dry-run / contract test.
//
// Reads the migration SQL off disk and asserts the schema contract the
// work-item model + the read/write adapters depend on. No DB connection —
// this is the dry-run safety check the execution plan's QA gate calls for
// on persistence PRs (RLS impact + idempotency).

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION_FILE = '20260517100000_sourcing_work_items.sql';
const MIGRATION_PATH = path.join(
  process.cwd(),
  'supabase/migrations',
  MIGRATION_FILE,
);

const sql = readFileSync(MIGRATION_PATH, 'utf8');

/** Whitespace-collapsed view, for column-definition assertions. */
const collapsed = sql.replace(/[ \t]+/g, ' ');

describe('sourcing_work_items migration · structure', () => {
  it('creates the sourcing_work_items table idempotently', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS sourcing_work_items');
  });

  it('is wrapped in a BEGIN/COMMIT transaction', () => {
    expect(sql).toContain('BEGIN;');
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true);
    expect(sql.indexOf('BEGIN;')).toBeLessThan(
      sql.indexOf('CREATE TABLE IF NOT EXISTS sourcing_work_items'),
    );
  });

  it('keys the table by tenant and a contract / source-event / vendor subject', () => {
    expect(collapsed).toContain('tenant_client_key TEXT NOT NULL');
    expect(sql).toContain('subject_kind');
    expect(sql).toContain('subject_ref');
    expect(sql).toContain(
      "CHECK (subject_kind IN ('contract', 'source_event', 'vendor'))",
    );
  });

  it('constrains kind to the three Renewal Cockpit action-bar actions', () => {
    expect(sql).toContain(
      "CHECK (kind IN ('serve_notice', 'owner_assignment', 'tower_watch'))",
    );
  });

  it('carries owner, due_date (SLA), and status', () => {
    expect(sql).toContain('owner');
    expect(collapsed).toContain('due_date DATE');
    expect(sql).toContain(
      "CHECK (status IN ('open', 'in_progress', 'done', 'cancelled'))",
    );
  });

  it('carries legal + procurement workflow state for serve-notice items', () => {
    expect(sql).toContain('legal_status');
    expect(sql).toContain('procurement_status');
    expect(sql).toContain("'served'");
  });

  it('records audit fields — created/updated by + at', () => {
    expect(sql).toContain('created_by');
    expect(collapsed).toContain('created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    expect(sql).toContain('updated_by');
    expect(collapsed).toContain('updated_at TIMESTAMPTZ NOT NULL DEFAULT now()');
  });
});

describe('sourcing_work_items migration · RLS', () => {
  it('ENABLEs row level security on the table', () => {
    expect(sql).toContain(
      'ALTER TABLE sourcing_work_items ENABLE ROW LEVEL SECURITY',
    );
  });

  it('adds a tenant-scoped read policy via can_read_tenant_by_key', () => {
    expect(sql).toContain('CREATE POLICY auth_read ON sourcing_work_items');
    expect(sql).toContain('can_read_tenant_by_key(tenant_client_key)');
  });

  it('grants SELECT to authenticated and full access to service_role only', () => {
    expect(sql).toContain(
      'GRANT SELECT ON sourcing_work_items TO authenticated',
    );
    expect(sql).toContain('CREATE POLICY svc_all ON sourcing_work_items');
    // No public-role / anon write path.
    expect(sql).not.toContain('TO public');
    expect(sql).not.toContain('TO anon');
  });
});

describe('sourcing_work_items migration · safety (dry-run)', () => {
  it('contains no destructive patterns', () => {
    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });

  it('declares the supporting indexes idempotently', () => {
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_sourcing_work_items_subject',
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_sourcing_work_items_kind',
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_sourcing_work_items_due',
    );
  });
});
