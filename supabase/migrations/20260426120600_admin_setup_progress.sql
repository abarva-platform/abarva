-- ADMIN-DATA10 · admin_setup_progress
-- Computed/cached rolled-up setup-step status per tenant.
-- Sourced from ADMIN-DATA1 audit §3.7. Tenant-scoped via clients(id), service-role-only RLS.
-- Recomputation function (out of scope here) reads from admin_connectors,
-- admin_datasets, team_memberships, admin_blockers and writes the rolled-up step status.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL CHECK (step_id IN (
    'data_trust', 'connectors', 'users_access', 'agent_readiness',
    'production_readiness', 'architecture'
  )),
  status TEXT NOT NULL CHECK (status IN ('done', 'in_progress', 'pending')) DEFAULT 'pending',
  description TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_setup_progress_client
  ON admin_setup_progress(client_id);

ALTER TABLE admin_setup_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_setup_progress" ON admin_setup_progress;
CREATE POLICY "service_role_all_admin_setup_progress" ON admin_setup_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
