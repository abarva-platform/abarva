-- ADMIN-DATA10 · admin_audit_log
-- Admin-page interaction events + tenant-readiness state transitions.
-- Distinct from existing audit_log (021) which is data-mutation-scoped.
-- Sourced from ADMIN-DATA1 audit §3.6. Tenant-scoped via clients(id), service-role-only RLS.
-- Wave 27+ writes events; this wave only reads.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  actor_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'auth', 'role_change', 'connector', 'dataset', 'approval',
    'blocker', 'setup_progress', 'readiness_state', 'other'
  )),
  action TEXT NOT NULL,
  target_kind TEXT,
  target_id UUID,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_client_recent
  ON admin_audit_log(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_category
  ON admin_audit_log(client_id, category, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_audit_log" ON admin_audit_log;
CREATE POLICY "service_role_all_admin_audit_log" ON admin_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
