-- Source contract-depth package Layer 2 adapter substrate.
--
-- This is an additive operator table for package-backed Source adapter rows.
-- It is intentionally not a product read model. Layer 3 loaders must read back
-- this table before writing canonical Source objects.

BEGIN;

CREATE TABLE IF NOT EXISTS source.contract_depth_package_load_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  load_run_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  package_sha256 TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'completed', 'failed')),
  layer2_row_count INT NOT NULL DEFAULT 0,
  layer3_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_gate JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof_bundle_path TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, load_run_id),
  UNIQUE (tenant_key, dataset_version, idempotency_key, mode)
);

CREATE TABLE IF NOT EXISTS source.contract_depth_adapter_row (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  adapter_name TEXT NOT NULL,
  source_row_id TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  source_row_number INT NULL,
  source_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_state TEXT NOT NULL DEFAULT 'adapter_validated',
  load_run_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, adapter_name, source_row_id)
);

CREATE INDEX IF NOT EXISTS idx_contract_depth_adapter_row_dataset
  ON source.contract_depth_adapter_row (tenant_key, dataset_version, adapter_name);

CREATE INDEX IF NOT EXISTS idx_contract_depth_adapter_row_contract
  ON source.contract_depth_adapter_row (tenant_key, dataset_version, (payload->>'contract_id'));

CREATE INDEX IF NOT EXISTS idx_contract_depth_package_load_run_status
  ON source.contract_depth_package_load_run (tenant_key, dataset_version, status, started_at DESC);

GRANT SELECT ON source.contract_depth_package_load_run TO authenticated, service_role;
GRANT SELECT ON source.contract_depth_adapter_row TO authenticated, service_role;

COMMIT;
