import { readFileSync } from 'node:fs';
import path from 'node:path';

import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION_FILE = '20260905120000_source_event_approval_ledger_restore.sql';
const MIGRATION_PATH = path.join(
  process.cwd(),
  'supabase/migrations',
  MIGRATION_FILE,
);

const sql = readFileSync(MIGRATION_PATH, 'utf8');
const collapsed = sql.replace(/[ \t]+/g, ' ');

describe('source_event_approvals restore migration', () => {
  it('recreates the approval ledger table idempotently', () => {
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS source_event_approvals',
    );
    expect(collapsed).toContain(
      'event_id UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE',
    );
    expect(collapsed).toContain("action TEXT NOT NULL DEFAULT 'admin_review'");
    expect(collapsed).toContain('approved_by_user_id TEXT NOT NULL');
    expect(collapsed).toContain('approved_at TIMESTAMPTZ NOT NULL DEFAULT now()');
  });

  it('restores the stage-level audit column used by the approval writer', () => {
    expect(sql).toContain('stage_key TEXT');
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS source_event_approvals_event_stage_idx',
    );
  });

  it('keeps approvals tenant-scoped through the parent event row', () => {
    expect(sql).toContain(
      'CREATE POLICY "authenticated_read_source_event_approvals"',
    );
    expect(sql).toContain(
      'CREATE POLICY "authenticated_insert_source_event_approvals"',
    );
    expect(sql).toContain('WHERE se.id = source_event_approvals.event_id');
    expect(sql).toContain('can_read_tenant_by_key(se.client_key)');
    expect(sql).toContain('is_tenant_admin()');
    expect(sql).toContain('approved_by_user_id = current_user_id()');
  });

  it('preserves append-only approval receipts for authenticated users', () => {
    expect(sql).toContain(
      'CREATE POLICY "block_update_source_event_approvals"',
    );
    expect(sql).toContain(
      'CREATE POLICY "block_delete_source_event_approvals"',
    );
    expect(sql).toContain('FOR UPDATE TO authenticated');
    expect(sql).toContain('FOR DELETE TO authenticated');
    expect(sql).toContain('USING (false)');
  });

  it('grants only read and insert to authenticated users', () => {
    expect(sql).toContain(
      'GRANT SELECT, INSERT ON source_event_approvals TO authenticated',
    );
    expect(sql).toContain(
      'GRANT ALL ON source_event_approvals TO service_role',
    );
    expect(sql).not.toContain('TO anon');
    expect(sql).not.toContain('TO public');
  });

  it('contains no destructive table or data operations', () => {
    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });
});
