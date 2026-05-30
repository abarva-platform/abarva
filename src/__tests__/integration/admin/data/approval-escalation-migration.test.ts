/**
 * PRE-W4-PR-4 · approval-escalation migration smoke
 *
 * Static SQL inspection — we don't spin up Postgres in this test, we
 * just assert that the new migration adds the four escalation columns,
 * the CHECK constraint, and preserves the original RLS posture from
 * the parent migration (`20260430120100_program_approval_workflow.sql`).
 *
 * The RLS preservation claim is structural: the new migration must NOT
 * touch the existing policies; it only adds columns and an index.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.resolve(
    process.cwd(),
    'supabase/migrations/20260530210000_approval_escalation.sql',
  ),
  'utf-8',
);

const parentSql = readFileSync(
  path.resolve(
    process.cwd(),
    'supabase/migrations/20260430120100_program_approval_workflow.sql',
  ),
  'utf-8',
);

describe('migration · approval escalation', () => {
  it('adds escalation_level INT DEFAULT 0', () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS escalation_level INT NOT NULL DEFAULT 0/,
    );
  });

  it('adds last_notified_at TIMESTAMPTZ', () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ NULL/,
    );
  });

  it('adds notify_count INT DEFAULT 0', () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS notify_count INT NOT NULL DEFAULT 0/,
    );
  });

  it('adds escalated_to_user_id TEXT NULL', () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS escalated_to_user_id TEXT NULL/,
    );
  });

  it('declares the CHECK constraint for escalation_level IN (0,1,2)', () => {
    expect(sql).toMatch(/program_approval_requests_escalation_level_chk/);
    expect(sql).toMatch(
      /CHECK \(escalation_level IN \(0,\s*1,\s*2\)\)/,
    );
  });

  it('adds a pending-only index for SLA sorting', () => {
    expect(sql).toMatch(
      /idx_program_approval_requests_tenant_pending_age/,
    );
    expect(sql).toMatch(/WHERE request_status = 'pending'/);
  });

  it('does NOT touch the existing RLS policies', () => {
    // Defensive: the new migration should not drop or recreate any
    // of the parent migration's policy names.
    const protectedPolicies = [
      'service_role_all_program_approval_requests',
      'authenticated_read_program_approval_requests',
      'authenticated_insert_program_approval_requests',
      'tenant_admin_update_program_approval_requests',
      'block_delete_program_approval_requests',
    ];
    for (const p of protectedPolicies) {
      expect(sql).not.toMatch(new RegExp(`CREATE POLICY "${p}"`));
      expect(sql).not.toMatch(new RegExp(`DROP POLICY .*"${p}"`));
      // Sanity — they DO exist in the parent migration.
      expect(parentSql).toMatch(new RegExp(p));
    }
  });

  it('runs inside a BEGIN/COMMIT block', () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});
