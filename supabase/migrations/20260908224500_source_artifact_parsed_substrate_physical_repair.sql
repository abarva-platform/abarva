-- Restore the physical parsed-evidence and reasoning substrate used by Source.
--
-- Historical migration rows can exist even when these server-managed tables
-- are absent. This additive repair recreates the final table shapes without
-- changing source_artifacts or rewriting any tenant data.

BEGIN;

CREATE TABLE IF NOT EXISTS source_artifact_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_kind TEXT NOT NULL DEFAULT 'source_document_chunk',
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  embedding_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_source_artifact_chunks_chunk_id
  ON source_artifact_chunks (chunk_id);
CREATE INDEX IF NOT EXISTS idx_source_artifact_chunks_event
  ON source_artifact_chunks (tenant_key, source_event_id);

CREATE TABLE IF NOT EXISTS source_artifact_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  fact_value JSONB NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  validation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_artifact_facts_event_key
  ON source_artifact_facts (tenant_key, source_event_id, fact_key);

CREATE TABLE IF NOT EXISTS source_pricing_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  vendor_id TEXT NULL,
  component_key TEXT NOT NULL,
  component_label TEXT NOT NULL,
  amount_usd NUMERIC(18,2) NULL,
  unit TEXT NULL,
  year_index INT NULL,
  pricing_model TEXT NULL,
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_pricing_components_event_vendor
  ON source_pricing_components (tenant_key, source_event_id, vendor_id);

CREATE TABLE IF NOT EXISTS source_commercial_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  vendor_id TEXT NULL,
  exception_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  recommendation TEXT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  confidence NUMERIC(4,3) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_commercial_exceptions_event
  ON source_commercial_exceptions (tenant_key, source_event_id, severity, status);

CREATE TABLE IF NOT EXISTS source_vendor_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  vendor_id TEXT NULL,
  commitment_type TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  metric JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_vendor_commitments_event_vendor
  ON source_vendor_commitments (tenant_key, source_event_id, vendor_id);

CREATE TABLE IF NOT EXISTS source_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  requirement_key TEXT NOT NULL,
  requirement_text TEXT NOT NULL,
  requirement_category TEXT NOT NULL DEFAULT 'other',
  required BOOLEAN NOT NULL DEFAULT true,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_requirements_event
  ON source_requirements (tenant_key, source_event_id, requirement_category);

CREATE TABLE IF NOT EXISTS source_meeting_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  outcome_type TEXT NOT NULL,
  outcome_text TEXT NOT NULL,
  owner TEXT NULL,
  due_date DATE NULL,
  status TEXT NOT NULL DEFAULT 'open',
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_meeting_outcomes_event
  ON source_meeting_outcomes (tenant_key, source_event_id, outcome_type, status);

CREATE TABLE IF NOT EXISTS source_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  from_node_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NULL,
  graph_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_graph_edges_event
  ON source_graph_edges (tenant_key, source_event_id, from_node_id, edge_type);

CREATE TABLE IF NOT EXISTS source_context_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  turn_id TEXT NULL,
  agent_name TEXT NOT NULL,
  question TEXT NULL,
  used_artifact_ids UUID[] NOT NULL DEFAULT '{}',
  used_chunk_ids TEXT[] NOT NULL DEFAULT '{}',
  used_fact_ids UUID[] NOT NULL DEFAULT '{}',
  used_graph_edge_ids UUID[] NOT NULL DEFAULT '{}',
  used_pattern_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_context_receipts_event
  ON source_context_receipts (tenant_key, source_event_id, created_at DESC);

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'source_artifact_chunks',
    'source_artifact_facts',
    'source_pricing_components',
    'source_commercial_exceptions',
    'source_vendor_commitments',
    'source_requirements',
    'source_meeting_outcomes',
    'source_graph_edges',
    'source_context_receipts'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'service_role_all_' || tbl, tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', 'service_role_all_' || tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'authenticated_read_' || tbl || '_by_tenant', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (tenant_key = (auth.jwt() ->> ''tenant_key''))', 'authenticated_read_' || tbl || '_by_tenant', tbl);
    EXECUTE format('GRANT SELECT ON %I TO authenticated', tbl);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS source_reasoning_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL UNIQUE,
  source_event_id UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  artifact_code TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'refusal', 'gate_failed', 'error')),
  archetype TEXT,
  rigor TEXT,
  confidence_label TEXT,
  confidence_score NUMERIC(4,3),
  refusal_reason TEXT,
  missing_evidence JSONB,
  claims JSONB,
  envelope JSONB,
  generated_by_user_id TEXT,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_source_reasoning_envelopes_event
  ON source_reasoning_envelopes (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_reasoning_envelopes_tenant
  ON source_reasoning_envelopes (tenant_key);
CREATE INDEX IF NOT EXISTS idx_source_reasoning_envelopes_status
  ON source_reasoning_envelopes (status);
ALTER TABLE source_reasoning_envelopes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all_source_reasoning_envelopes
  ON source_reasoning_envelopes;
CREATE POLICY service_role_all_source_reasoning_envelopes
  ON source_reasoning_envelopes FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS authenticated_read_source_reasoning_envelopes
  ON source_reasoning_envelopes;
CREATE POLICY authenticated_read_source_reasoning_envelopes
  ON source_reasoning_envelopes FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_write_source_reasoning_envelopes
  ON source_reasoning_envelopes;
CREATE POLICY authenticated_write_source_reasoning_envelopes
  ON source_reasoning_envelopes FOR INSERT TO authenticated
  WITH CHECK (can_read_tenant_by_key(tenant_key));
GRANT SELECT, INSERT ON source_reasoning_envelopes TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
