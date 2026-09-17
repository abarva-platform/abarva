-- Durable, tenant-scoped row snapshots for an explicitly approved opportunity cutover.
-- This archive is operational evidence, not a product read model.

BEGIN;

CREATE TABLE IF NOT EXISTS source.opportunity_cutover_run (
  run_id TEXT PRIMARY KEY,
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  writer_dataset_version TEXT NOT NULL,
  ownership_manifest_sha256 TEXT NOT NULL CHECK (ownership_manifest_sha256 ~ '^[a-f0-9]{64}$'),
  inventory_sha256 TEXT NOT NULL CHECK (inventory_sha256 ~ '^[a-f0-9]{64}$'),
  opportunity_ids JSONB NOT NULL CHECK (jsonb_typeof(opportunity_ids) = 'array'),
  archive_row_count INTEGER NOT NULL CHECK (archive_row_count >= 0),
  state TEXT NOT NULL CHECK (state IN ('retired', 'restored')),
  operator_identity TEXT NOT NULL,
  proof_location TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, contract_id, run_id)
);

CREATE TABLE IF NOT EXISTS source.opportunity_cutover_archive (
  run_id TEXT NOT NULL REFERENCES source.opportunity_cutover_run (run_id),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table ~ '^source\.[a-z_]+$'),
  source_row_id UUID NOT NULL,
  row_payload JSONB NOT NULL CHECK (jsonb_typeof(row_payload) = 'object'),
  row_sha256 TEXT NOT NULL CHECK (row_sha256 ~ '^[a-f0-9]{64}$'),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, source_table, source_row_id),
  FOREIGN KEY (tenant_key, dataset_version, contract_id, run_id)
    REFERENCES source.opportunity_cutover_run (tenant_key, dataset_version, contract_id, run_id)
);

CREATE INDEX IF NOT EXISTS source_opportunity_cutover_archive_scope_idx
  ON source.opportunity_cutover_archive (tenant_key, dataset_version, contract_id, source_table);

ALTER TABLE source.opportunity_cutover_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE source.opportunity_cutover_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_opportunity_cutover_run
  ON source.opportunity_cutover_run FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY service_role_read_opportunity_cutover_archive
  ON source.opportunity_cutover_archive FOR SELECT TO service_role
  USING (true);

CREATE POLICY service_role_insert_opportunity_cutover_archive
  ON source.opportunity_cutover_archive FOR INSERT TO service_role
  WITH CHECK (true);

COMMIT;
