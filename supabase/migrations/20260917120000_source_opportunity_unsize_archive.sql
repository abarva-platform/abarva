-- Additive operational archive for a scoped, reversible canonical correction.
BEGIN;

CREATE TABLE source.opportunity_unsize_run (
  run_id TEXT PRIMARY KEY,
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  opportunity_ids JSONB NOT NULL CHECK (jsonb_typeof(opportunity_ids) = 'array'),
  manifest_sha256 TEXT NOT NULL CHECK (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  package_sha256 TEXT NOT NULL CHECK (package_sha256 ~ '^[a-f0-9]{64}$'),
  before_sha256 TEXT NOT NULL CHECK (before_sha256 ~ '^[a-f0-9]{64}$'),
  after_sha256 TEXT NOT NULL CHECK (after_sha256 ~ '^[a-f0-9]{64}$'),
  archive_row_count INTEGER NOT NULL CHECK (archive_row_count > 0),
  state TEXT NOT NULL CHECK (state IN ('applied', 'restored')),
  operator_identity TEXT NOT NULL,
  prepared_proof_url TEXT NOT NULL,
  restore_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ,
  UNIQUE (run_id, tenant_key, dataset_version, contract_id)
);

CREATE TABLE source.opportunity_unsize_archive (
  run_id TEXT NOT NULL REFERENCES source.opportunity_unsize_run(run_id),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_row_id UUID NOT NULL,
  row_payload JSONB NOT NULL CHECK (jsonb_typeof(row_payload) = 'object'),
  row_sha256 TEXT NOT NULL CHECK (row_sha256 ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY (run_id, source_table, source_row_id),
  FOREIGN KEY (run_id, tenant_key, dataset_version, contract_id)
    REFERENCES source.opportunity_unsize_run(run_id, tenant_key, dataset_version, contract_id)
);

CREATE INDEX opportunity_unsize_archive_scope_idx
  ON source.opportunity_unsize_archive(tenant_key, dataset_version, contract_id, run_id);

ALTER TABLE source.opportunity_unsize_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE source.opportunity_unsize_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_all_opportunity_unsize_run ON source.opportunity_unsize_run
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_read_opportunity_unsize_archive ON source.opportunity_unsize_archive
  FOR SELECT TO service_role USING (true);
CREATE POLICY service_role_insert_opportunity_unsize_archive ON source.opportunity_unsize_archive
  FOR INSERT TO service_role WITH CHECK (true);
COMMIT;
