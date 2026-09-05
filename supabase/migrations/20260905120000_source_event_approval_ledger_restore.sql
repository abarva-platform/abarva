-- Restore the Source event approval ledger table used by the stage gate writer.
--
-- The approval route updates source_events and appends an immutable receipt to
-- source_event_approvals in the same transaction. This migration keeps that
-- write contract intact after schema cleanup by recreating the ledger
-- idempotently and reapplying the tenant-scoped RLS policies.

BEGIN;

CREATE TABLE IF NOT EXISTS source_event_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'admin_review',
  approved_by_user_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  notes TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stage_key TEXT
);

ALTER TABLE source_event_approvals
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS approved_by_user_id TEXT,
  ADD COLUMN IF NOT EXISTS from_state TEXT,
  ADD COLUMN IF NOT EXISTS to_state TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stage_key TEXT;

ALTER TABLE source_event_approvals
  ALTER COLUMN action SET DEFAULT 'admin_review',
  ALTER COLUMN approved_at SET DEFAULT now();

UPDATE source_event_approvals
SET action = 'admin_review'
WHERE action IS NULL;

UPDATE source_event_approvals
SET approved_at = now()
WHERE approved_at IS NULL;

ALTER TABLE source_event_approvals
  ALTER COLUMN action SET NOT NULL,
  ALTER COLUMN approved_at SET NOT NULL;

COMMENT ON TABLE source_event_approvals IS
  'Append-only Source stage approval receipt ledger. Tenant scope is inherited from the parent source_events row.';

COMMENT ON COLUMN source_event_approvals.stage_key IS
  'Source stage key captured at approval time for stage-level audit and reporting.';

CREATE INDEX IF NOT EXISTS source_event_approvals_event_idx
  ON source_event_approvals(event_id);

CREATE INDEX IF NOT EXISTS source_event_approvals_approver_idx
  ON source_event_approvals(approved_by_user_id);

CREATE INDEX IF NOT EXISTS source_event_approvals_event_stage_idx
  ON source_event_approvals(event_id, stage_key);

ALTER TABLE source_event_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON source_event_approvals;
CREATE POLICY "service_role_full_access" ON source_event_approvals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_approvals" ON source_event_approvals;
CREATE POLICY "authenticated_read_source_event_approvals" ON source_event_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_approvals.event_id
        AND can_read_tenant_by_key(se.client_key)
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_source_event_approvals" ON source_event_approvals;
CREATE POLICY "authenticated_insert_source_event_approvals" ON source_event_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_approvals.event_id
        AND can_read_tenant_by_key(se.client_key)
    )
    AND is_tenant_admin()
    AND approved_by_user_id = current_user_id()
  );

DROP POLICY IF EXISTS "block_update_source_event_approvals" ON source_event_approvals;
CREATE POLICY "block_update_source_event_approvals" ON source_event_approvals
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "block_delete_source_event_approvals" ON source_event_approvals;
CREATE POLICY "block_delete_source_event_approvals" ON source_event_approvals
  FOR DELETE TO authenticated
  USING (false);

GRANT SELECT, INSERT ON source_event_approvals TO authenticated;
GRANT ALL ON source_event_approvals TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
