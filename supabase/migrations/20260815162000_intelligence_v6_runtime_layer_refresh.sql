-- Intelligence V6 runtime layer refresh substrate
--
-- Additive only. This creates the canonical object/fact landing tables and
-- raw relationship edge ledger needed by the governed ACA runtime refresh job.

CREATE SCHEMA IF NOT EXISTS intelligence_v6;

CREATE TABLE IF NOT EXISTS intelligence_v6.layer_refresh_runs (
  run_key text PRIMARY KEY,
  tenant_scope text[] NOT NULL,
  build_version text NOT NULL,
  input_source_version text NOT NULL,
  idempotency_key text NOT NULL,
  git_sha text NOT NULL DEFAULT '',
  image_digest text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_gate jsonb NOT NULL DEFAULT '{}'::jsonb,
  proof_bundle_uri text NOT NULL DEFAULT '',
  release_record text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intelligence_v6.business_records (
  record_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  contract_version text NOT NULL DEFAULT 'enterprise-intelligence-template-pack-v6',
  build_version text NOT NULL,
  input_source_version text NOT NULL,
  idempotency_key text NOT NULL,
  domain text NOT NULL,
  object_type text NOT NULL,
  source_object_id text NOT NULL,
  canonical_object_key text,
  display_name text NOT NULL,
  source_file text NOT NULL DEFAULT '',
  source_row_number integer CHECK (source_row_number IS NULL OR source_row_number >= 1),
  source_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  relationships jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_authority jsonb NOT NULL DEFAULT '{}'::jsonb,
  lineage jsonb NOT NULL DEFAULT '[]'::jsonb,
  sensitivity text NOT NULL,
  data_status text NOT NULL,
  quality_status text NOT NULL,
  fact_status text NOT NULL DEFAULT 'active'
    CHECK (fact_status IN ('active', 'blocked_conflict', 'quarantined')),
  blocked_claims text[] NOT NULL DEFAULT '{}'::text[],
  quarantine_ratio numeric(6,4) NOT NULL DEFAULT 0
    CHECK (quarantine_ratio >= 0 AND quarantine_ratio <= 1),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, contract_version, object_type, source_object_id)
);

CREATE TABLE IF NOT EXISTS intelligence_v6.relationship_edges (
  edge_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  contract_version text NOT NULL DEFAULT 'enterprise-intelligence-template-pack-v6',
  build_version text NOT NULL,
  input_source_version text NOT NULL,
  idempotency_key text NOT NULL,
  relationship_id text NOT NULL,
  source_record_key text,
  source_object_type text NOT NULL,
  source_object_name text NOT NULL,
  target_object_type text NOT NULL,
  target_object_name text NOT NULL,
  relationship_type text NOT NULL,
  relationship_confidence text NOT NULL DEFAULT 'unknown',
  evidence_basis text NOT NULL DEFAULT '',
  source_file text NOT NULL DEFAULT '',
  source_row_number integer CHECK (source_row_number IS NULL OR source_row_number >= 1),
  source_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  node_resolution_state text NOT NULL DEFAULT 'resolved'
    CHECK (node_resolution_state IN ('resolved', 'from_orphan', 'to_orphan', 'both_orphan', 'unresolved')),
  quarantine_ratio numeric(6,4) NOT NULL DEFAULT 0
    CHECK (quarantine_ratio >= 0 AND quarantine_ratio <= 1),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, contract_version, relationship_id, source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS intelligence_v6.relationship_types (
  relationship_type text PRIMARY KEY,
  canonical_label text NOT NULL,
  inverse_relationship_type text,
  relationship_category text NOT NULL,
  directionality text NOT NULL DEFAULT 'directed'
    CHECK (directionality IN ('directed', 'bidirectional')),
  executive_safe boolean NOT NULL DEFAULT true,
  allowed_from_object_families text[] NOT NULL DEFAULT '{}'::text[],
  allowed_to_object_families text[] NOT NULL DEFAULT '{}'::text[],
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intelligence_v6.graph_nodes (
  node_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  contract_version text NOT NULL DEFAULT 'enterprise-intelligence-template-pack-v6',
  node_id text NOT NULL,
  object_family text NOT NULL,
  business_display_name text NOT NULL,
  canonical_name text NOT NULL,
  source_record_id text,
  source_record_key text,
  source_file text NOT NULL DEFAULT '',
  source_row_number integer CHECK (source_row_number IS NULL OR source_row_number >= 1),
  source_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner text,
  criticality text,
  confidence text NOT NULL DEFAULT 'unknown'
    CHECK (confidence IN ('high', 'medium', 'low', 'unknown')),
  known_gaps text[] NOT NULL DEFAULT '{}'::text[],
  materialized_from text NOT NULL DEFAULT 'v6_business_record'
    CHECK (materialized_from IN ('v6_business_record', 'relationship_endpoint', 'manual_override', 'system_seed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, contract_version, node_id)
);

CREATE TABLE IF NOT EXISTS intelligence_v6.graph_edges (
  edge_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  contract_version text NOT NULL DEFAULT 'enterprise-intelligence-template-pack-v6',
  relationship_id text NOT NULL,
  from_node_id text NOT NULL,
  to_node_id text NOT NULL,
  from_node_key text,
  to_node_key text,
  from_object_family text,
  to_object_family text,
  relationship_type text NOT NULL REFERENCES intelligence_v6.relationship_types(relationship_type),
  relationship_category text NOT NULL,
  relationship_confidence text NOT NULL DEFAULT 'unknown'
    CHECK (relationship_confidence IN ('high', 'medium', 'low', 'unknown')),
  evidence_basis text NOT NULL DEFAULT '',
  raw_relationship_type text NOT NULL,
  source_relationship_key text,
  source_file text NOT NULL DEFAULT '',
  source_row_number integer CHECK (source_row_number IS NULL OR source_row_number >= 1),
  source_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  known_gaps text[] NOT NULL DEFAULT '{}'::text[],
  caveats text[] NOT NULL DEFAULT '{}'::text[],
  node_resolution_state text NOT NULL DEFAULT 'unresolved'
    CHECK (node_resolution_state IN ('resolved', 'from_orphan', 'to_orphan', 'both_orphan', 'unresolved')),
  self_edge boolean GENERATED ALWAYS AS (from_node_id = to_node_id) STORED,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, contract_version, relationship_id, source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS intelligence_v6.graph_quality_reports (
  report_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  contract_version text NOT NULL DEFAULT 'enterprise-intelligence-template-pack-v6',
  graph_version text NOT NULL DEFAULT 'v6-canonical-graph-v1',
  run_key text,
  total_nodes integer NOT NULL DEFAULT 0 CHECK (total_nodes >= 0),
  total_edges integer NOT NULL DEFAULT 0 CHECK (total_edges >= 0),
  explicit_node_count integer NOT NULL DEFAULT 0 CHECK (explicit_node_count >= 0),
  inferred_node_count integer NOT NULL DEFAULT 0 CHECK (inferred_node_count >= 0),
  orphan_edge_count integer NOT NULL DEFAULT 0 CHECK (orphan_edge_count >= 0),
  orphan_edge_rate numeric(6,4) NOT NULL DEFAULT 0 CHECK (orphan_edge_rate >= 0 AND orphan_edge_rate <= 1),
  self_edge_count integer NOT NULL DEFAULT 0 CHECK (self_edge_count >= 0),
  self_edge_rate numeric(6,4) NOT NULL DEFAULT 0 CHECK (self_edge_rate >= 0 AND self_edge_rate <= 1),
  placeholder_object_family_count integer NOT NULL DEFAULT 0 CHECK (placeholder_object_family_count >= 0),
  placeholder_object_family_rate numeric(6,4) NOT NULL DEFAULT 0 CHECK (placeholder_object_family_rate >= 0 AND placeholder_object_family_rate <= 1),
  normalized_relationship_type_count integer NOT NULL DEFAULT 0 CHECK (normalized_relationship_type_count >= 0),
  normalized_relationship_type_rate numeric(6,4) NOT NULL DEFAULT 0 CHECK (normalized_relationship_type_rate >= 0 AND normalized_relationship_type_rate <= 1),
  high_confidence_edge_count integer NOT NULL DEFAULT 0 CHECK (high_confidence_edge_count >= 0),
  medium_confidence_edge_count integer NOT NULL DEFAULT 0 CHECK (medium_confidence_edge_count >= 0),
  low_confidence_edge_count integer NOT NULL DEFAULT 0 CHECK (low_confidence_edge_count >= 0),
  unknown_confidence_edge_count integer NOT NULL DEFAULT 0 CHECK (unknown_confidence_edge_count >= 0),
  source_owner_coverage_rate numeric(6,4) NOT NULL DEFAULT 0 CHECK (source_owner_coverage_rate >= 0 AND source_owner_coverage_rate <= 1),
  evidence_coverage_rate numeric(6,4) NOT NULL DEFAULT 0 CHECK (evidence_coverage_rate >= 0 AND evidence_coverage_rate <= 1),
  executive_readiness_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (executive_readiness_score >= 0 AND executive_readiness_score <= 100),
  quality_status text NOT NULL DEFAULT 'not_ready'
    CHECK (quality_status IN ('board_ready', 'exploratory', 'data_thin', 'not_ready')),
  summary text NOT NULL DEFAULT '',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO intelligence_v6.relationship_types (
  relationship_type,
  canonical_label,
  inverse_relationship_type,
  relationship_category,
  directionality,
  executive_safe,
  description
)
VALUES
  ('SUPPORTS', 'supports', 'SUPPORTED_BY', 'dependency', 'directed', true, 'One object supports another object or operating capability.'),
  ('DEPENDS_ON', 'depends on', 'SUPPORTS', 'dependency', 'directed', true, 'One object requires another object to operate or deliver value.'),
  ('HOSTED_ON', 'hosted on', 'HOSTS', 'infrastructure', 'directed', true, 'A system, service, or workload is hosted on an infrastructure or platform object.'),
  ('OWNED_BY', 'owned by', 'OWNS', 'ownership', 'directed', true, 'An object is accountable to an owner, role, organization, or function.'),
  ('PRIMARY_SYSTEM_FOR', 'primary system for', 'HAS_PRIMARY_SYSTEM', 'system_role', 'directed', true, 'A system is the primary system for a function, process, or capability.'),
  ('SYSTEM_OF_RECORD_FOR', 'system of record for', 'HAS_SYSTEM_OF_RECORD', 'system_role', 'directed', true, 'A system is the authoritative record for a data domain or business object.'),
  ('VENDOR_SUPPORTS_SYSTEM', 'vendor supports system', 'SYSTEM_SUPPORTED_BY_VENDOR', 'vendor_system', 'directed', true, 'A vendor supports, runs, licenses, or maintains a system.'),
  ('FUNDS', 'funds', 'FUNDED_BY', 'financial', 'directed', true, 'A budget, program, or funding source pays for an object or initiative.'),
  ('MITIGATES', 'mitigates', 'MITIGATED_BY', 'risk_control', 'directed', true, 'A control, action, or program mitigates a risk.'),
  ('FEEDS', 'feeds', 'FED_BY', 'data_flow', 'directed', true, 'A data source, integration, or process feeds another object.'),
  ('BLOCKS', 'blocks', 'BLOCKED_BY', 'risk_control', 'directed', true, 'A risk, gap, dependency, or constraint blocks another object.'),
  ('MEASURES', 'measures', 'MEASURED_BY', 'measurement', 'directed', true, 'A KPI, metric, or evidence object measures an initiative, process, or outcome.'),
  ('USES', 'uses', 'USED_BY', 'usage', 'directed', true, 'An object uses a system, data asset, capability, vendor, or process.'),
  ('MODERNIZES', 'modernizes', 'MODERNIZED_BY', 'transformation', 'directed', true, 'A program, move, or initiative modernizes a system, process, or capability.'),
  ('IMPACTS', 'impacts', 'IMPACTED_BY', 'impact', 'directed', true, 'An object has a material effect on another object.'),
  ('GOVERNS', 'governs', 'GOVERNED_BY', 'governance', 'directed', true, 'A policy, role, control, or forum governs another object.'),
  ('ROLLS_UP_TO', 'rolls up to', 'HAS_CHILD', 'hierarchy', 'directed', true, 'An object rolls up to a parent object, portfolio, function, or domain.')
ON CONFLICT (relationship_type) DO UPDATE SET
  canonical_label = EXCLUDED.canonical_label,
  inverse_relationship_type = EXCLUDED.inverse_relationship_type,
  relationship_category = EXCLUDED.relationship_category,
  directionality = EXCLUDED.directionality,
  executive_safe = EXCLUDED.executive_safe,
  description = EXCLUDED.description,
  active = true,
  updated_at = now();

INSERT INTO intelligence_v6.relationship_types (
  relationship_type,
  canonical_label,
  inverse_relationship_type,
  relationship_category,
  directionality,
  executive_safe,
  description
)
VALUES
  ('AFFECTS', 'affects', 'AFFECTED_BY', 'impact', 'directed', true, 'One object affects another object, operation, risk, or outcome.'),
  ('DISCUSSES', 'discusses', 'DISCUSSED_BY', 'evidence', 'directed', true, 'An interview, evidence source, or narrative record discusses an object.'),
  ('HAS_RISK', 'has risk', 'RISK_APPLIES_TO', 'risk_control', 'directed', true, 'An object has an associated risk, control, or governance concern.'),
  ('INTEGRATES_WITH', 'integrates with', 'INTEGRATES_WITH', 'data_flow', 'bidirectional', true, 'One system or data asset integrates with another.'),
  ('OPERATED_BY', 'operated by', 'OPERATES', 'ownership', 'directed', true, 'An object is operationally managed by an owner, team, function, or role.'),
  ('OWNS', 'owns', 'OWNED_BY', 'ownership', 'directed', true, 'An owner, team, function, or organization owns an object.'),
  ('OWNS_TECHNOLOGY_FOR', 'owns technology for', 'TECHNOLOGY_OWNED_BY', 'ownership', 'directed', true, 'A technology owner is accountable for a business function, system, or domain.'),
  ('PROVIDED_BY', 'provided by', 'PROVIDES', 'vendor_system', 'directed', true, 'An object is provided by a vendor, service, platform, or owner.'),
  ('PROVIDES', 'provides', 'PROVIDED_BY', 'vendor_system', 'directed', true, 'A vendor, platform, or service provides another object.'),
  ('REQUIRES_DATA', 'requires data', 'DATA_REQUIRED_BY', 'data_flow', 'directed', true, 'An object requires a data asset, domain, integration, or evidence source.'),
  ('REQUIRES_SYSTEM', 'requires system', 'SYSTEM_REQUIRED_BY', 'dependency', 'directed', true, 'An object requires an application, platform, or system.'),
  ('SUPPORTED_BY', 'supported by', 'SUPPORTS', 'dependency', 'directed', true, 'An object is supported by another object.'),
  ('SUPPORTS_FUNCTION', 'supports function', 'FUNCTION_SUPPORTED_BY', 'dependency', 'directed', true, 'An object supports a business function.'),
  ('TECHNOLOGY_OWNED_BY', 'technology owned by', 'OWNS_TECHNOLOGY_FOR', 'ownership', 'directed', true, 'A technology object is accountable to a technology owner.'),
  ('USES_DATA_DOMAIN', 'uses data domain', 'DATA_DOMAIN_USED_BY', 'data_flow', 'directed', true, 'An object uses a data domain or data asset.')
ON CONFLICT (relationship_type) DO UPDATE SET
  canonical_label = EXCLUDED.canonical_label,
  inverse_relationship_type = EXCLUDED.inverse_relationship_type,
  relationship_category = EXCLUDED.relationship_category,
  directionality = EXCLUDED.directionality,
  executive_safe = EXCLUDED.executive_safe,
  description = EXCLUDED.description,
  active = true,
  updated_at = now();

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_business_records_tenant_object
ON intelligence_v6.business_records (tenant_key, contract_version, object_type);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_business_records_status
ON intelligence_v6.business_records (tenant_key, contract_version, quality_status, fact_status);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_relationship_edges_tenant_type
ON intelligence_v6.relationship_edges (tenant_key, contract_version, relationship_type);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_layer_refresh_runs_status
ON intelligence_v6.layer_refresh_runs (status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_nodes_tenant_family
ON intelligence_v6.graph_nodes (tenant_key, contract_version, object_family);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_nodes_display
ON intelligence_v6.graph_nodes (tenant_key, canonical_name);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_nodes_gaps
ON intelligence_v6.graph_nodes USING gin (known_gaps);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_edges_tenant_type
ON intelligence_v6.graph_edges (tenant_key, contract_version, relationship_type);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_edges_from
ON intelligence_v6.graph_edges (tenant_key, contract_version, from_node_id);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_edges_to
ON intelligence_v6.graph_edges (tenant_key, contract_version, to_node_id);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_edges_resolution
ON intelligence_v6.graph_edges (tenant_key, contract_version, node_resolution_state);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_edges_gaps
ON intelligence_v6.graph_edges USING gin (known_gaps);

CREATE INDEX IF NOT EXISTS idx_intelligence_v6_graph_quality_tenant_generated
ON intelligence_v6.graph_quality_reports (tenant_key, contract_version, generated_at DESC);

ALTER TABLE intelligence_v6.layer_refresh_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.business_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.relationship_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.relationship_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.graph_quality_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_v6_relationship_types_read ON intelligence_v6.relationship_types;
CREATE POLICY intelligence_v6_relationship_types_read
ON intelligence_v6.relationship_types FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS intelligence_v6_layer_refresh_runs_tenant_select
ON intelligence_v6.layer_refresh_runs;
CREATE POLICY intelligence_v6_layer_refresh_runs_tenant_select
ON intelligence_v6.layer_refresh_runs FOR SELECT USING (
  current_setting('app.tenant_key', true) = ANY(tenant_scope)
  OR current_setting('app.client_key', true) = ANY(tenant_scope)
  OR current_setting('app.tenant_key', true) = 'internal-admin'
  OR current_setting('app.client_key', true) = 'internal-admin'
);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'business_records',
    'relationship_edges',
    'graph_nodes',
    'graph_edges',
    'graph_quality_reports'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS intelligence_v6_runtime_layer_tenant_select ON intelligence_v6.%I', table_name);
    EXECUTE format(
      'CREATE POLICY intelligence_v6_runtime_layer_tenant_select ON intelligence_v6.%I FOR SELECT USING (
        tenant_key = current_setting(''app.tenant_key'', true)
        OR tenant_key = current_setting(''app.client_key'', true)
        OR current_setting(''app.tenant_key'', true) = ''internal-admin''
        OR current_setting(''app.client_key'', true) = ''internal-admin''
      )',
      table_name
    );
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA intelligence_v6 TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.layer_refresh_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.business_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.relationship_edges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.relationship_types TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.graph_nodes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.graph_edges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.graph_quality_reports TO service_role;
GRANT SELECT ON intelligence_v6.relationship_types TO authenticated;
GRANT SELECT ON intelligence_v6.business_records TO authenticated;
GRANT SELECT ON intelligence_v6.relationship_edges TO authenticated;
GRANT SELECT ON intelligence_v6.graph_nodes TO authenticated;
GRANT SELECT ON intelligence_v6.graph_edges TO authenticated;
GRANT SELECT ON intelligence_v6.graph_quality_reports TO authenticated;

COMMENT ON TABLE intelligence_v6.business_records IS
  'Tenant-scoped canonical ingestion records written by the governed ACA runtime layer refresh job.';
COMMENT ON TABLE intelligence_v6.relationship_edges IS
  'Raw canonical relationship edge ledger; resolved rows can be materialized into graph_edges, unresolved rows stay quarantined.';
COMMENT ON TABLE intelligence_v6.relationship_types IS
  'Canonical V6 relationship dictionary. Raw edge verbs must normalize here before graph traversal, UI rendering, or model prompt use.';
COMMENT ON TABLE intelligence_v6.graph_nodes IS
  'Canonical tenant-scoped V6 graph nodes materialized from V6 business objects or unresolved relationship endpoints.';
COMMENT ON TABLE intelligence_v6.graph_edges IS
  'Canonical tenant-scoped V6 graph edges normalized through intelligence_v6.relationship_types with source evidence and node-resolution state.';
COMMENT ON TABLE intelligence_v6.graph_quality_reports IS
  'Deterministic tenant graph quality/readiness reports for safe graph use by product surfaces after explicit activation.';
COMMENT ON COLUMN intelligence_v6.business_records.quarantine_ratio IS
  'Current tenant graph quarantine ratio at the time the record was written; consumers must not infer full graph coverage.';
COMMENT ON COLUMN intelligence_v6.relationship_edges.quarantine_ratio IS
  'Current tenant graph quarantine ratio at the time the edge was written; consumers must not infer full graph coverage.';
COMMENT ON COLUMN intelligence_v6.graph_edges.node_resolution_state IS
  'resolved when both endpoints map to canonical graph_nodes; *_orphan values keep unresolved endpoints visible instead of fabricating node certainty.';
COMMENT ON COLUMN intelligence_v6.graph_quality_reports.executive_readiness_score IS
  '0-100 deterministic readiness score for graph use. It is not a business-value metric and must not be narrated as ROI.';
