-- SETUP-DATA-LAYER · Failure-mode-driven Setup/Admin data substrate
-- Backend-only migration. Creates tenant-scoped segment storage, provenance/audit,
-- graph relationship fallback, and context chunk tables for the Apex synthetic tenant data.

BEGIN;

CREATE TABLE IF NOT EXISTS data_inventory_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  segment_name TEXT NOT NULL,
  family_number SMALLINT NOT NULL CHECK (family_number BETWEEN 1 AND 14),
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

CREATE TABLE IF NOT EXISTS tenant_expected_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  tenant_archetype TEXT NOT NULL DEFAULT 'retail',
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

CREATE TABLE IF NOT EXISTS data_inventory_records (
  id UUID DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  title TEXT NOT NULL,
  record_kind TEXT NOT NULL,
  source_doc TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_basis TEXT NOT NULL DEFAULT 'tenant_admin_upload',
  uploaded_by TEXT NOT NULL DEFAULT 'Apex synthetic dataset import',
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

CREATE TABLE IF NOT EXISTS data_segment_enterprise_profile PARTITION OF data_inventory_records FOR VALUES IN ('enterprise_profile');
CREATE TABLE IF NOT EXISTS data_segment_org_structure PARTITION OF data_inventory_records FOR VALUES IN ('org_structure');
CREATE TABLE IF NOT EXISTS data_segment_it_landscape PARTITION OF data_inventory_records FOR VALUES IN ('it_landscape');
CREATE TABLE IF NOT EXISTS data_segment_it_financials PARTITION OF data_inventory_records FOR VALUES IN ('it_financials');
CREATE TABLE IF NOT EXISTS data_segment_kpi_dictionary PARTITION OF data_inventory_records FOR VALUES IN ('kpi_dictionary');
CREATE TABLE IF NOT EXISTS data_segment_program_inventory PARTITION OF data_inventory_records FOR VALUES IN ('program_inventory');
CREATE TABLE IF NOT EXISTS data_segment_sourcing_artifacts PARTITION OF data_inventory_records FOR VALUES IN ('sourcing_artifacts');
CREATE TABLE IF NOT EXISTS data_segment_program_deliverables PARTITION OF data_inventory_records FOR VALUES IN ('program_deliverables');
CREATE TABLE IF NOT EXISTS data_segment_evidence_ledger PARTITION OF data_inventory_records FOR VALUES IN ('evidence_ledger');
CREATE TABLE IF NOT EXISTS data_segment_operating_telemetry PARTITION OF data_inventory_records FOR VALUES IN ('operating_telemetry');
CREATE TABLE IF NOT EXISTS data_segment_vendor_contracts PARTITION OF data_inventory_records FOR VALUES IN ('vendor_contracts');
CREATE TABLE IF NOT EXISTS data_segment_compliance PARTITION OF data_inventory_records FOR VALUES IN ('compliance');
CREATE TABLE IF NOT EXISTS data_segment_industry_context PARTITION OF data_inventory_records FOR VALUES IN ('industry_context');
CREATE TABLE IF NOT EXISTS data_segment_cross_program_signals PARTITION OF data_inventory_records FOR VALUES IN ('cross_program_signals');

CREATE INDEX IF NOT EXISTS idx_data_inventory_records_tenant_segment ON data_inventory_records(tenant_key, segment_id);
CREATE INDEX IF NOT EXISTS idx_data_inventory_records_source ON data_inventory_records(tenant_key, source_doc);
CREATE INDEX IF NOT EXISTS idx_data_inventory_records_freshness ON data_inventory_records(tenant_key, freshness_state);

CREATE TABLE IF NOT EXISTS enterprise_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  source_segment_id TEXT,
  source_record_id TEXT,
  source_doc TEXT,
  source_basis TEXT NOT NULL DEFAULT 'tenant_admin_upload',
  data_classification TEXT NOT NULL DEFAULT 'Internal',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  last_reviewed DATE,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, node_id)
);

CREATE TABLE IF NOT EXISTS enterprise_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  edge_id TEXT NOT NULL,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  source_segment_id TEXT,
  source_record_id TEXT,
  source_doc TEXT,
  source_basis TEXT NOT NULL DEFAULT 'tenant_admin_upload',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, edge_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_graph_nodes_tenant_type ON enterprise_graph_nodes(tenant_key, node_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_graph_edges_tenant_type ON enterprise_graph_edges(tenant_key, edge_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_graph_edges_from ON enterprise_graph_edges(tenant_key, from_node_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_graph_edges_to ON enterprise_graph_edges(tenant_key, to_node_id);

CREATE TABLE IF NOT EXISTS enterprise_context_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  source_segment_id TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_doc TEXT NOT NULL,
  source_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  token_count INTEGER,
  embedding_status TEXT NOT NULL DEFAULT 'pending' CHECK (embedding_status IN ('pending','skipped','embedded','failed')),
  embedding_model TEXT,
  embedded_at TIMESTAMPTZ,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  chunk_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_tenant_segment ON enterprise_context_chunks(tenant_key, source_segment_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_source ON enterprise_context_chunks(tenant_key, source_record_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_embedding_status ON enterprise_context_chunks(tenant_key, embedding_status);

CREATE TABLE IF NOT EXISTS data_inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  actor_id TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system_import',
  action TEXT NOT NULL,
  segment_id TEXT,
  record_id TEXT,
  before_state JSONB,
  after_state JSONB,
  classification_at_action TEXT,
  source_doc TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_inventory_audit_tenant_created ON data_inventory_audit_log(tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_inventory_audit_segment ON data_inventory_audit_log(tenant_key, segment_id);

CREATE TABLE IF NOT EXISTS data_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_root TEXT,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed')) DEFAULT 'started',
  records_loaded BIGINT NOT NULL DEFAULT 0,
  chunks_loaded BIGINT NOT NULL DEFAULT 0,
  nodes_loaded BIGINT NOT NULL DEFAULT 0,
  edges_loaded BIGINT NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_ingestion_runs_tenant_started ON data_ingestion_runs(tenant_key, started_at DESC);

ALTER TABLE data_inventory_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_expected_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_enterprise_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_org_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_it_landscape ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_it_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_kpi_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_program_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_sourcing_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_program_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_evidence_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_operating_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_industry_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_segment_cross_program_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_context_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_inventory_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_ingestion_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_data_inventory_segments" ON data_inventory_segments;
CREATE POLICY "service_role_all_data_inventory_segments" ON data_inventory_segments FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_tenant_expected_baselines" ON tenant_expected_baselines;
CREATE POLICY "service_role_all_tenant_expected_baselines" ON tenant_expected_baselines FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_data_inventory_records" ON data_inventory_records;
CREATE POLICY "service_role_all_data_inventory_records" ON data_inventory_records FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_enterprise_graph_nodes" ON enterprise_graph_nodes;
CREATE POLICY "service_role_all_enterprise_graph_nodes" ON enterprise_graph_nodes FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_enterprise_graph_edges" ON enterprise_graph_edges;
CREATE POLICY "service_role_all_enterprise_graph_edges" ON enterprise_graph_edges FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_enterprise_context_chunks" ON enterprise_context_chunks;
CREATE POLICY "service_role_all_enterprise_context_chunks" ON enterprise_context_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_data_inventory_audit_log" ON data_inventory_audit_log;
CREATE POLICY "service_role_all_data_inventory_audit_log" ON data_inventory_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_data_ingestion_runs" ON data_ingestion_runs;
CREATE POLICY "service_role_all_data_ingestion_runs" ON data_ingestion_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
