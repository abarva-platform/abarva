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

ALTER TABLE intelligence_v6.layer_refresh_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.business_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_v6.relationship_edges ENABLE ROW LEVEL SECURITY;

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
    'relationship_edges'
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

GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.layer_refresh_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.business_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_v6.relationship_edges TO service_role;
GRANT SELECT ON intelligence_v6.business_records TO authenticated;
GRANT SELECT ON intelligence_v6.relationship_edges TO authenticated;

COMMENT ON TABLE intelligence_v6.business_records IS
  'Tenant-scoped canonical ingestion records written by the governed ACA runtime layer refresh job.';
COMMENT ON TABLE intelligence_v6.relationship_edges IS
  'Raw canonical relationship edge ledger; resolved rows can be materialized into graph_edges, unresolved rows stay quarantined.';
COMMENT ON COLUMN intelligence_v6.business_records.quarantine_ratio IS
  'Current tenant graph quarantine ratio at the time the record was written; consumers must not infer full graph coverage.';
COMMENT ON COLUMN intelligence_v6.relationship_edges.quarantine_ratio IS
  'Current tenant graph quarantine ratio at the time the edge was written; consumers must not infer full graph coverage.';
