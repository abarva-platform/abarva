-- ADMIN-DATA10 · admin_blockers
-- Pilot/production readiness blockers per tenant — owner_agent {steward, nexus, sentinel, atlas}.
-- Sourced from ADMIN-DATA1 audit §3.5. Tenant-scoped via clients(id), service-role-only RLS.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  affected_scope TEXT NOT NULL CHECK (affected_scope IN ('demo', 'pilot', 'production')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'waived')) DEFAULT 'open',
  owner_agent TEXT NOT NULL CHECK (owner_agent IN ('steward', 'nexus', 'sentinel', 'atlas')),
  blocker_reason TEXT NOT NULL,
  unblock_steps JSONB DEFAULT '[]'::jsonb,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_blockers_client_status
  ON admin_blockers(client_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_blockers_scope
  ON admin_blockers(client_id, affected_scope, status);

ALTER TABLE admin_blockers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_blockers" ON admin_blockers;
CREATE POLICY "service_role_all_admin_blockers" ON admin_blockers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
