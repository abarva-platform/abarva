-- ADMIN-DATA10 · admin_dataset_quality
-- Per-dataset quality measurements: completeness, freshness, schema_conformance, lineage, sample_agreement, overall.
-- Sourced from ADMIN-DATA1 audit §3.4. Tenant-scoped via clients(id), service-role-only RLS.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_dataset_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES admin_datasets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  completeness NUMERIC(5,2) NOT NULL CHECK (completeness BETWEEN 0 AND 100),
  freshness NUMERIC(5,2) NOT NULL CHECK (freshness BETWEEN 0 AND 100),
  schema_conformance NUMERIC(5,2) NOT NULL CHECK (schema_conformance BETWEEN 0 AND 100),
  lineage NUMERIC(5,2) NOT NULL CHECK (lineage BETWEEN 0 AND 100),
  sample_agreement NUMERIC(5,2) NOT NULL CHECK (sample_agreement BETWEEN 0 AND 100),
  overall NUMERIC(5,2) NOT NULL CHECK (overall BETWEEN 0 AND 100),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_dataset_quality_dataset
  ON admin_dataset_quality(dataset_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_dataset_quality_client
  ON admin_dataset_quality(client_id, measured_at DESC);

ALTER TABLE admin_dataset_quality ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_dataset_quality" ON admin_dataset_quality;
CREATE POLICY "service_role_all_admin_dataset_quality" ON admin_dataset_quality
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
