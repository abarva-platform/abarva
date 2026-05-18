// Execution Room kinds · migration dry-run / contract test.
//
// The additive migration that widens the `sourcing_work_items.kind` CHECK
// constraint so the Source Execution Room can persist its action workplan
// and stakeholder approvals onto the same table. No DB connection — this is
// the dry-run safety check (RLS impact + idempotency + non-destructive).

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { scanForDestructivePatterns } from '@/scripts/run-migrations';

const MIGRATION_FILE = '20260517210000_work_items_execution_room_kinds.sql';
const MIGRATION_PATH = path.join(
  process.cwd(),
  'supabase/migrations',
  MIGRATION_FILE,
);

const sql = readFileSync(MIGRATION_PATH, 'utf8');

describe('work-items execution-room kinds migration · structure', () => {
  it('is wrapped in a BEGIN/COMMIT transaction', () => {
    expect(sql).toContain('BEGIN;');
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true);
  });

  it('widens the kind CHECK to admit the two Execution Room kinds', () => {
    expect(sql).toContain('workplan_item');
    expect(sql).toContain('stakeholder_approval');
    // The original three kinds remain valid — no row is invalidated.
    expect(sql).toContain('serve_notice');
    expect(sql).toContain('owner_assignment');
    expect(sql).toContain('tower_watch');
  });

  it('drops and recreates the kind constraint idempotently', () => {
    expect(sql).toContain(
      'DROP CONSTRAINT IF EXISTS sourcing_work_items_kind_check',
    );
    expect(sql).toContain('ADD CONSTRAINT sourcing_work_items_kind_check');
  });

  it('touches no column, index, RLS policy, or grant', () => {
    expect(sql).not.toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).not.toContain('CREATE POLICY');
    expect(sql).not.toContain('CREATE INDEX');
    expect(sql).not.toContain('ADD COLUMN');
  });
});

describe('work-items execution-room kinds migration · safety (dry-run)', () => {
  it('contains no destructive patterns', () => {
    // DROP CONSTRAINT is routine idempotency scaffolding; the `ALTER TABLE`
    // and `DROP` sit on separate lines so the line-scoped scanner is clean.
    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });
});
