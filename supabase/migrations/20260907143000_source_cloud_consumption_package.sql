-- Source cloud-consumption package substrate.
--
-- Additive Layer 2 and Layer 3 tables for cloud contract, AWS/Azure telemetry,
-- commitment coverage, resource inventory, tag quality, and AP reconciliation
-- rows. These tables are not product-owned read models; Source/Tower/aVa must
-- consume them only through governed Layer 4 projections after reconciliation.

BEGIN;

CREATE SCHEMA IF NOT EXISTS source;
CREATE SCHEMA IF NOT EXISTS consumption;

CREATE TABLE IF NOT EXISTS source.cloud_consumption_package_load_run (
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

CREATE TABLE IF NOT EXISTS source.cloud_consumption_adapter_row (
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

CREATE TABLE IF NOT EXISTS source.cloud_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  cloud_account_id TEXT NOT NULL,
  cloud_provider TEXT NOT NULL,
  account_name TEXT NOT NULL,
  business_unit TEXT NULL,
  technical_owner TEXT NULL,
  account_type TEXT NULL,
  source_system TEXT NULL,
  tag_policy_state TEXT NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, cloud_account_id)
);

CREATE TABLE IF NOT EXISTS source.cloud_service_usage_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  usage_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NULL,
  cloud_provider TEXT NOT NULL,
  cloud_account_id TEXT NOT NULL,
  business_unit TEXT NULL,
  application_ref TEXT NULL,
  service_name TEXT NOT NULL,
  usage_type TEXT NULL,
  region TEXT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  usage_quantity NUMERIC(20,6) NULL,
  usage_unit TEXT NULL,
  on_demand_spend_usd NUMERIC(18,2) NULL,
  covered_spend_usd NUMERIC(18,2) NULL,
  total_spend_usd NUMERIC(18,2) NULL,
  owner_tag TEXT NULL,
  environment_tag TEXT NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, usage_id)
);

CREATE TABLE IF NOT EXISTS source.cloud_commitment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  commitment_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NULL,
  cloud_provider TEXT NOT NULL,
  commitment_type TEXT NOT NULL,
  annual_commitment_usd NUMERIC(18,2) NULL,
  hourly_commitment_usd NUMERIC(18,4) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  utilization_pct NUMERIC(10,6) NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, commitment_id)
);

CREATE TABLE IF NOT EXISTS source.cloud_commitment_coverage_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  coverage_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NULL,
  cloud_provider TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  eligible_stable_workload_spend_usd NUMERIC(18,2) NULL,
  commitment_covered_spend_usd NUMERIC(18,2) NULL,
  on_demand_eligible_spend_usd NUMERIC(18,2) NULL,
  commitment_coverage_pct NUMERIC(10,6) NULL,
  commitment_utilization_pct NUMERIC(10,6) NULL,
  recommended_step_up_usd NUMERIC(18,2) NULL,
  expected_discount_pct NUMERIC(10,6) NULL,
  candidate_monthly_savings_usd NUMERIC(18,2) NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, coverage_id)
);

CREATE TABLE IF NOT EXISTS source.cloud_resource_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  resource_inventory_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NULL,
  cloud_provider TEXT NOT NULL,
  service_name TEXT NOT NULL,
  sku TEXT NULL,
  region TEXT NULL,
  application_ref TEXT NULL,
  business_unit TEXT NULL,
  owner_tag TEXT NULL,
  environment_tag TEXT NULL,
  avg_cpu_utilization_pct NUMERIC(10,6) NULL,
  avg_memory_utilization_pct NUMERIC(10,6) NULL,
  monthly_spend_usd NUMERIC(18,2) NULL,
  rightsize_signal TEXT NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, resource_inventory_id)
);

CREATE TABLE IF NOT EXISTS source.cloud_tag_quality_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  tag_quality_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NULL,
  cloud_provider TEXT NOT NULL,
  account_subscription_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_spend_usd NUMERIC(18,2) NULL,
  owner_tagged_spend_usd NUMERIC(18,2) NULL,
  application_tagged_spend_usd NUMERIC(18,2) NULL,
  untagged_spend_usd NUMERIC(18,2) NULL,
  owner_tag_coverage_pct NUMERIC(10,6) NULL,
  application_tag_coverage_pct NUMERIC(10,6) NULL,
  data_quality_state TEXT NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, tag_quality_id)
);

CREATE TABLE IF NOT EXISTS source.cloud_ap_invoice_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  reconciliation_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  cloud_billing_export_amount_usd NUMERIC(18,2) NULL,
  ap_invoice_amount_usd NUMERIC(18,2) NULL,
  paid_amount_usd NUMERIC(18,2) NULL,
  variance_usd NUMERIC(18,2) NULL,
  reconciliation_state TEXT NOT NULL,
  source_file_id TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'reviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, reconciliation_id)
);

CREATE INDEX IF NOT EXISTS idx_cloud_consumption_adapter_row_dataset
  ON source.cloud_consumption_adapter_row (tenant_key, dataset_version, adapter_name);
CREATE INDEX IF NOT EXISTS idx_cloud_usage_contract
  ON source.cloud_service_usage_observation (tenant_key, dataset_version, contract_id, period_start);
CREATE INDEX IF NOT EXISTS idx_cloud_coverage_contract
  ON source.cloud_commitment_coverage_observation (tenant_key, dataset_version, contract_id, period_start);
CREATE INDEX IF NOT EXISTS idx_cloud_resource_contract
  ON source.cloud_resource_inventory (tenant_key, dataset_version, contract_id, rightsize_signal);
CREATE INDEX IF NOT EXISTS idx_cloud_tag_quality_contract
  ON source.cloud_tag_quality_observation (tenant_key, dataset_version, contract_id, period_start);
CREATE INDEX IF NOT EXISTS idx_cloud_ap_recon_contract
  ON source.cloud_ap_invoice_reconciliation (tenant_key, dataset_version, contract_id, period_start);

ALTER TABLE source.optimization_opportunity
  DROP CONSTRAINT IF EXISTS optimization_opportunity_value_type_check;

ALTER TABLE source.optimization_opportunity
  ADD CONSTRAINT optimization_opportunity_value_type_check
  CHECK (value_type IN ('recoverable_leakage', 'avoided_cost', 'negotiated_improvement', 'control_action'));

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'cloud_consumption_package_load_run',
    'cloud_consumption_adapter_row',
    'cloud_account',
    'cloud_service_usage_observation',
    'cloud_commitment',
    'cloud_commitment_coverage_observation',
    'cloud_resource_inventory',
    'cloud_tag_quality_observation',
    'cloud_ap_invoice_reconciliation'
  ] LOOP
    EXECUTE format('ALTER TABLE source.%I ENABLE ROW LEVEL SECURITY', table_name);

    EXECUTE format('DROP POLICY IF EXISTS service_role_all_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY service_role_all_%I ON source.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS authenticated_read_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY authenticated_read_%I ON source.%I FOR SELECT USING (source.can_read_sourcing_tenant(tenant_key))',
      table_name,
      table_name
    );

    EXECUTE format('GRANT SELECT ON source.%I TO authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON source.%I TO service_role', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE source.cloud_service_usage_observation IS
  'Canonical cloud billing and usage observations by provider, account, service, application, region, month, and coverage state.';
COMMENT ON TABLE source.cloud_commitment_coverage_observation IS
  'Canonical commitment coverage observations that tie native cloud recommendation evidence to contract and AP context.';
COMMENT ON TABLE source.cloud_ap_invoice_reconciliation IS
  'Month-grain reconciliation between native cloud billing exports and AP invoice/paid amounts.';

COMMIT;
