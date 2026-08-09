-- Source Contract Optimization V1.1 hardening.
--
-- Adds immutable source snapshots, entity links, canonical fact assertions,
-- and fact conflicts. Product surfaces must consume resolved facts and refuse
-- to size opportunities when blocking source contradictions remain unresolved.

BEGIN;

CREATE TABLE IF NOT EXISTS source.source_record_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_record_hash TEXT NOT NULL,
  native_record_key TEXT NULL,
  contract_id TEXT NULL,
  vendor_id TEXT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, snapshot_id)
);

CREATE TABLE IF NOT EXISTS source.evidence_entity_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  link_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  contract_id TEXT NULL,
  vendor_id TEXT NULL,
  link_basis TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  review_state TEXT NOT NULL DEFAULT 'system_extracted',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, link_id),
  FOREIGN KEY (tenant_key, dataset_version, snapshot_id)
    REFERENCES source.source_record_snapshot (tenant_key, dataset_version, snapshot_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.canonical_fact_assertion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  assertion_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  contract_id TEXT NULL,
  vendor_id TEXT NULL,
  fact_key TEXT NOT NULL,
  value_text TEXT NULL,
  value_numeric NUMERIC(20,6) NULL,
  value_date DATE NULL,
  currency TEXT NULL,
  unit TEXT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  source_system TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_record_id TEXT NULL,
  source_document_id TEXT NULL,
  source_page TEXT NULL,
  source_span TEXT NULL,
  assertion_basis TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  review_state TEXT NOT NULL DEFAULT 'system_extracted',
  active_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_to TIMESTAMPTZ NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, assertion_id)
);

CREATE TABLE IF NOT EXISTS source.fact_conflict (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  conflict_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  contract_id TEXT NULL,
  vendor_id TEXT NULL,
  fact_key TEXT NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('numeric_mismatch', 'text_mismatch', 'date_mismatch')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'blocker')),
  resolution_state TEXT NOT NULL DEFAULT 'unresolved' CHECK (resolution_state IN ('unresolved', 'resolved', 'waived')),
  summary TEXT NOT NULL,
  assertion_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  numeric_delta NUMERIC(20,6) NULL,
  percent_delta NUMERIC(10,6) NULL,
  resolved_assertion_id TEXT NULL,
  resolved_by_role TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, conflict_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_optimization_opportunity_tenant_opportunity
  ON source.optimization_opportunity (tenant_key, opportunity_id);

CREATE INDEX IF NOT EXISTS idx_source_record_snapshot_contract
  ON source.source_record_snapshot (tenant_key, dataset_version, contract_id, source_table, source_record_id);
CREATE INDEX IF NOT EXISTS idx_source_evidence_entity_link_entity
  ON source.evidence_entity_link (tenant_key, dataset_version, entity_kind, entity_id);
CREATE INDEX IF NOT EXISTS idx_source_canonical_fact_assertion_entity
  ON source.canonical_fact_assertion (tenant_key, dataset_version, entity_kind, entity_id, fact_key);
CREATE INDEX IF NOT EXISTS idx_source_fact_conflict_unresolved
  ON source.fact_conflict (tenant_key, dataset_version, severity, resolution_state, fact_key)
  WHERE resolution_state = 'unresolved';

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'source_record_snapshot',
    'evidence_entity_link',
    'canonical_fact_assertion',
    'fact_conflict'
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
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON source.%I TO service_role', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE source.source_record_snapshot IS
  'Immutable source-row snapshot used to prove calculation inputs back to the client extract row and hash.';
COMMENT ON TABLE source.evidence_entity_link IS
  'Reviewed or system-derived link from a source snapshot to a governed entity such as contract, invoice line, SLA period, or finance confirmation.';
COMMENT ON TABLE source.canonical_fact_assertion IS
  'One sourced assertion of one fact. Contradictory assertions are preserved and resolved rather than overwritten.';
COMMENT ON TABLE source.fact_conflict IS
  'Detected contradictions between canonical fact assertions. Blocking conflicts must be resolved before opportunity sizing or approval.';

COMMIT;
