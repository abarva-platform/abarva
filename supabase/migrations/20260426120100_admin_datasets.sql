-- ADMIN-DATA10 · admin_datasets
-- Per-tenant admin dataset inventory across the data-trust rungs (raw → audit_trail).
-- Sourced from ADMIN-DATA1 audit §3.2. Tenant-scoped via clients(id), service-role-only RLS.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  domain TEXT NOT NULL,
  rung TEXT NOT NULL CHECK (rung IN (
    'raw', 'verified', 'blessed', 'ground_truth', 'audit_trail'
  )),
  row_count BIGINT,
  owner_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  lineage_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  schema_summary JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_admin_datasets_client_rung
  ON admin_datasets(client_id, rung);

ALTER TABLE admin_datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_datasets" ON admin_datasets;
CREATE POLICY "service_role_all_admin_datasets" ON admin_datasets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
