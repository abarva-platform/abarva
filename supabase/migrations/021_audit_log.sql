-- Migration 021 · Audit log for consequential state changes
-- Every engagement.created, gate_approved, invoice.created, person.created
-- lands here with actor + target + old/new diff.

BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_person_id UUID REFERENCES persons(id),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_person_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_audit" ON audit_log;
CREATE POLICY "service_role_all_audit" ON audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_own_audit" ON audit_log;
CREATE POLICY "authenticated_read_own_audit" ON audit_log
  FOR SELECT TO authenticated
  USING (actor_person_id::text = auth.jwt() ->> 'person_id');

GRANT SELECT ON audit_log TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
