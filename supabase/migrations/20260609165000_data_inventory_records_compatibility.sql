-- Data inventory compatibility substrate.
--
-- Production ACA logs on 2026-06-09 showed live SkyHarbor current-state
-- lookups failing with:
--   relation "data_inventory_records" does not exist
--
-- The application already treats data_inventory_records, data_inventory_segments,
-- and tenant_expected_baselines as the canonical setup/current-state substrate.
-- This migration is an additive compatibility guard for Azure/Postgres
-- environments where earlier setup-data migrations were marked/applied out of
-- order or the table family is absent. It creates only missing objects and does
-- not mutate source rows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.data_inventory_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  segment_name TEXT NOT NULL,
  family_number SMALLINT NOT NULL CHECK (family_number BETWEEN 1 AND 23),
  expected_baseline JSONB NOT NULL DEFAULT '{}'::jsonb,
  coverage_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (coverage_score BETWEEN 0 AND 100),
  health_state TEXT NOT NULL DEFAULT 'not_started' CHECK (health_state IN ('complete','partial','sparse','not_started','attention','critical')),
  record_count BIGINT NOT NULL DEFAULT 0,
  stale_count BIGINT NOT NULL DEFAULT 0,
  missing_count BIGINT NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  last_ingested_at TIMESTAMPTZ,
  provenance_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, segment_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_expected_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  tenant_archetype TEXT NOT NULL DEFAULT 'enterprise',
  segment_id TEXT NOT NULL,
  expected_record_count INTEGER,
  expected_freshness_days INTEGER,
  required_for_reasoning_modes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  coverage_weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  baseline_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, segment_id)
);

CREATE TABLE IF NOT EXISTS public.data_inventory_records (
  id UUID DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  title TEXT NOT NULL,
  record_kind TEXT NOT NULL,
  source_doc TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_basis TEXT NOT NULL DEFAULT 'tenant_admin_upload',
  uploaded_by TEXT NOT NULL DEFAULT 'system_import',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_classification TEXT NOT NULL DEFAULT 'Internal',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  last_reviewed DATE,
  freshness_state TEXT NOT NULL DEFAULT 'fresh' CHECK (freshness_state IN ('fresh','attention','stale','unknown')),
  ingestion_status TEXT NOT NULL DEFAULT 'persisted' CHECK (ingestion_status IN ('persisted','indexed','ingestion_failed')),
  indexed_at TIMESTAMPTZ,
  record_text TEXT,
  record_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, segment_id),
  UNIQUE (tenant_key, segment_id, record_id)
) PARTITION BY LIST (segment_id);

ALTER TABLE public.data_inventory_segments
  DROP CONSTRAINT IF EXISTS data_inventory_segments_family_number_check;

ALTER TABLE public.data_inventory_segments
  ADD CONSTRAINT data_inventory_segments_family_number_check
  CHECK (family_number BETWEEN 1 AND 23);

ALTER TABLE public.data_inventory_records
  ALTER COLUMN uploaded_by SET DEFAULT 'system_import';

CREATE TABLE IF NOT EXISTS public.data_segment_enterprise_profile
  PARTITION OF public.data_inventory_records FOR VALUES IN ('enterprise_profile');
CREATE TABLE IF NOT EXISTS public.data_segment_org_structure
  PARTITION OF public.data_inventory_records FOR VALUES IN ('org_structure');
CREATE TABLE IF NOT EXISTS public.data_segment_it_landscape
  PARTITION OF public.data_inventory_records FOR VALUES IN ('it_landscape');
CREATE TABLE IF NOT EXISTS public.data_segment_it_financials
  PARTITION OF public.data_inventory_records FOR VALUES IN ('it_financials');
CREATE TABLE IF NOT EXISTS public.data_segment_kpi_dictionary
  PARTITION OF public.data_inventory_records FOR VALUES IN ('kpi_dictionary');
CREATE TABLE IF NOT EXISTS public.data_segment_program_inventory
  PARTITION OF public.data_inventory_records FOR VALUES IN ('program_inventory');
CREATE TABLE IF NOT EXISTS public.data_segment_sourcing_artifacts
  PARTITION OF public.data_inventory_records FOR VALUES IN ('sourcing_artifacts');
CREATE TABLE IF NOT EXISTS public.data_segment_program_deliverables
  PARTITION OF public.data_inventory_records FOR VALUES IN ('program_deliverables');
CREATE TABLE IF NOT EXISTS public.data_segment_evidence_ledger
  PARTITION OF public.data_inventory_records FOR VALUES IN ('evidence_ledger');
CREATE TABLE IF NOT EXISTS public.data_segment_operating_telemetry
  PARTITION OF public.data_inventory_records FOR VALUES IN ('operating_telemetry');
CREATE TABLE IF NOT EXISTS public.data_segment_vendor_contracts
  PARTITION OF public.data_inventory_records FOR VALUES IN ('vendor_contracts');
CREATE TABLE IF NOT EXISTS public.data_segment_compliance
  PARTITION OF public.data_inventory_records FOR VALUES IN ('compliance');
CREATE TABLE IF NOT EXISTS public.data_segment_industry_context
  PARTITION OF public.data_inventory_records FOR VALUES IN ('industry_context');
CREATE TABLE IF NOT EXISTS public.data_segment_cross_program_signals
  PARTITION OF public.data_inventory_records FOR VALUES IN ('cross_program_signals');
CREATE TABLE IF NOT EXISTS public.data_segment_kpi_history
  PARTITION OF public.data_inventory_records FOR VALUES IN ('kpi_history');
CREATE TABLE IF NOT EXISTS public.data_segment_stakeholder_notes
  PARTITION OF public.data_inventory_records FOR VALUES IN ('stakeholder_notes');
CREATE TABLE IF NOT EXISTS public.data_segment_peer_benchmarks
  PARTITION OF public.data_inventory_records FOR VALUES IN ('peer_benchmarks');
CREATE TABLE IF NOT EXISTS public.data_segment_financial_model
  PARTITION OF public.data_inventory_records FOR VALUES IN ('financial_model');
CREATE TABLE IF NOT EXISTS public.data_segment_decision_traces
  PARTITION OF public.data_inventory_records FOR VALUES IN ('decision_traces');
CREATE TABLE IF NOT EXISTS public.data_segment_scenario_library
  PARTITION OF public.data_inventory_records FOR VALUES IN ('scenario_library');
CREATE TABLE IF NOT EXISTS public.data_segment_vendor_intelligence
  PARTITION OF public.data_inventory_records FOR VALUES IN ('vendor_intelligence');
CREATE TABLE IF NOT EXISTS public.data_segment_graph_relationships
  PARTITION OF public.data_inventory_records FOR VALUES IN ('graph_relationships');
CREATE TABLE IF NOT EXISTS public.data_segment_ai_transformation
  PARTITION OF public.data_inventory_records FOR VALUES IN ('ai_transformation');

CREATE INDEX IF NOT EXISTS idx_data_inventory_records_tenant_segment
  ON public.data_inventory_records(tenant_key, segment_id);
CREATE INDEX IF NOT EXISTS idx_data_inventory_records_source
  ON public.data_inventory_records(tenant_key, source_doc);
CREATE INDEX IF NOT EXISTS idx_data_inventory_records_freshness
  ON public.data_inventory_records(tenant_key, freshness_state);

ALTER TABLE public.data_inventory_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_expected_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_inventory_records ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.data_segment_enterprise_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_org_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_it_landscape ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_it_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_kpi_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_program_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_sourcing_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_program_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_evidence_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_operating_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_industry_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_cross_program_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_kpi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_stakeholder_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_peer_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_financial_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_decision_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_scenario_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_vendor_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_graph_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_segment_ai_transformation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_data_inventory_segments" ON public.data_inventory_segments;
CREATE POLICY "service_role_all_data_inventory_segments"
  ON public.data_inventory_segments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_tenant_expected_baselines" ON public.tenant_expected_baselines;
CREATE POLICY "service_role_all_tenant_expected_baselines"
  ON public.tenant_expected_baselines FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_data_inventory_records" ON public.data_inventory_records;
CREATE POLICY "service_role_all_data_inventory_records"
  ON public.data_inventory_records FOR ALL TO service_role
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
