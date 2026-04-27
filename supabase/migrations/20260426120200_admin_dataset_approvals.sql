-- ADMIN-DATA10 · admin_dataset_approvals
-- Steward approvals to promote a dataset between trust rungs.
-- Sourced from ADMIN-DATA1 audit §3.3. Tenant-scoped via clients(id), service-role-only RLS.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_dataset_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES admin_datasets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  from_rung TEXT NOT NULL CHECK (from_rung IN (
    'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail'
  )),
  to_rung TEXT NOT NULL CHECK (to_rung IN (
    'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail'
  )),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_by UUID REFERENCES persons(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by UUID REFERENCES persons(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_dataset_approvals_status
  ON admin_dataset_approvals(client_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_dataset_approvals_dataset
  ON admin_dataset_approvals(dataset_id, requested_at DESC);

ALTER TABLE admin_dataset_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_dataset_approvals" ON admin_dataset_approvals;
CREATE POLICY "service_role_all_admin_dataset_approvals" ON admin_dataset_approvals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
