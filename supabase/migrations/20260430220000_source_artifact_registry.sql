-- Source artifact registry · first runtime brick for Source document intelligence.
--
-- Uploaded files and generated Source work products must flow through the same
-- knowledge pipeline as patterns and tenant context: blob storage, registry,
-- parser, chunks, vector, graph, Postgres facts, context broker, agent use,
-- generated versions, approvals.
--
-- This migration creates the registry and downstream parsed-object tables. It
-- does not implement parsing/vector upsert/graph projection workers; those jobs
-- consume rows created here.

BEGIN;

-- ── Storage bucket · source-artifacts ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('source-artifacts', 'source-artifacts', false)
ON CONFLICT (id) DO NOTHING;

-- ── source_artifacts · canonical registry row ────────────────────────────
CREATE TABLE IF NOT EXISTS source_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  -- Text on purpose: seeded Source events use stable string IDs while DB-created
  -- events use UUIDs. source_event_row_id links to persisted rows when present.
  source_event_id TEXT NOT NULL,
  source_event_row_id UUID NULL REFERENCES source_events(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  artifact_family TEXT NOT NULL,
  artifact_kind TEXT NOT NULL,
  source_origin TEXT NOT NULL,
  source_format TEXT NOT NULL,
  original_name TEXT NOT NULL,
  -- Path or URI inside the source-artifacts bucket. Convention:
  -- {tenant_key}/{source_event_id}/{artifact_id}/{safe_filename}
  blob_uri TEXT NOT NULL UNIQUE,
  uploader_user_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  parse_status TEXT NOT NULL DEFAULT 'pending',
  embedding_status TEXT NOT NULL DEFAULT 'pending',
  graph_status TEXT NOT NULL DEFAULT 'pending',
  classification_status TEXT NOT NULL DEFAULT 'pending',
  data_classification TEXT NOT NULL DEFAULT 'Confidential',
  evidence_state TEXT NOT NULL DEFAULT 'unparsed',
  approval_state TEXT NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  supersedes_artifact_version_id UUID NULL,
  created_by TEXT NOT NULL,
  validated_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE source_artifacts
  ADD COLUMN IF NOT EXISTS tenant_key TEXT,
  ADD COLUMN IF NOT EXISTS source_event_id TEXT,
  ADD COLUMN IF NOT EXISTS source_event_row_id UUID,
  ADD COLUMN IF NOT EXISTS stage_key TEXT,
  ADD COLUMN IF NOT EXISTS artifact_family TEXT,
  ADD COLUMN IF NOT EXISTS artifact_kind TEXT,
  ADD COLUMN IF NOT EXISTS source_origin TEXT,
  ADD COLUMN IF NOT EXISTS source_format TEXT,
  ADD COLUMN IF NOT EXISTS original_name TEXT,
  ADD COLUMN IF NOT EXISTS blob_uri TEXT,
  ADD COLUMN IF NOT EXISTS uploader_user_id TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS sha256 TEXT,
  ADD COLUMN IF NOT EXISTS parse_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS embedding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS graph_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS classification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS data_classification TEXT NOT NULL DEFAULT 'Confidential',
  ADD COLUMN IF NOT EXISTS evidence_state TEXT NOT NULL DEFAULT 'unparsed',
  ADD COLUMN IF NOT EXISTS approval_state TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS supersedes_artifact_version_id UUID,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS validated_by TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_artifacts_blob_uri
  ON source_artifacts (blob_uri);
CREATE INDEX IF NOT EXISTS idx_source_artifacts_tenant_event
  ON source_artifacts (tenant_key, source_event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_source_artifacts_stage
  ON source_artifacts (tenant_key, source_event_id, stage_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_source_artifacts_processing
  ON source_artifacts (tenant_key, parse_status, embedding_status, graph_status) WHERE deleted_at IS NULL;

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_stage_key_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_stage_key_check
  CHECK (stage_key IN ('intake', 'scope', 'sourcing_strategy', 'rfp_rfi_package', 'vendor_responses', 'evaluation', 'orals_bafo', 'selection', 'contract_mobilization', 'value_realization'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_family_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_family_check
  CHECK (artifact_family IN ('rfi', 'rfp', 'bafo', 'scorecard', 'pricing_workbook', 'proposal', 'meeting_notes', 'workshop_output', 'decision_brief', 'transition_risk_register', 'sourcing_strategy', 'scope_document', 'other'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_origin_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_origin_check
  CHECK (source_origin IN ('uploaded', 'generated', 'reuploaded', 'imported', 'note_capture'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_format_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_format_check
  CHECK (source_format IN ('pdf', 'docx', 'xlsx', 'pptx', 'html', 'markdown', 'csv', 'txt', 'image', 'audio', 'video', 'unknown'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_parse_status_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_parse_status_check
  CHECK (parse_status IN ('pending', 'parsing', 'parsed', 'failed', 'needs_review'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_embedding_status_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_embedding_status_check
  CHECK (embedding_status IN ('pending', 'embedded', 'failed', 'not_applicable'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_graph_status_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_graph_status_check
  CHECK (graph_status IN ('pending', 'projected', 'failed', 'not_applicable'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_classification_status_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_classification_status_check
  CHECK (classification_status IN ('pending', 'classified', 'ambiguous', 'rejected'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_data_classification_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_data_classification_check
  CHECK (data_classification IN ('Public', 'Internal', 'Confidential', 'Restricted'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_evidence_state_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_evidence_state_check
  CHECK (evidence_state IN ('unparsed', 'parsed_uncited', 'cited', 'challenged', 'superseded'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_approval_state_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_approval_state_check
  CHECK (approval_state IN ('not_required', 'draft', 'in_review', 'approved', 'rejected', 'locked'));

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_size_bytes_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_size_bytes_check
  CHECK (size_bytes > 0 AND size_bytes <= 104857600);

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_version_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_version_check
  CHECK (version >= 1);

CREATE OR REPLACE FUNCTION update_source_artifacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS source_artifacts_updated_at_trigger ON source_artifacts;
CREATE TRIGGER source_artifacts_updated_at_trigger
  BEFORE UPDATE ON source_artifacts
  FOR EACH ROW EXECUTE FUNCTION update_source_artifacts_updated_at();

-- ── Parsed-object tables · consume parser output ────────────────────────
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

-- ── RLS · table access ──────────────────────────────────────────────────
ALTER TABLE source_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_source_artifacts" ON source_artifacts;
CREATE POLICY "service_role_all_source_artifacts" ON source_artifacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_read_source_artifacts_by_tenant" ON source_artifacts;
CREATE POLICY "authenticated_read_source_artifacts_by_tenant" ON source_artifacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND tenant_key = (auth.jwt() ->> 'tenant_key'));
DROP POLICY IF EXISTS "authenticated_insert_source_artifacts_by_tenant" ON source_artifacts;
CREATE POLICY "authenticated_insert_source_artifacts_by_tenant" ON source_artifacts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_key = (auth.jwt() ->> 'tenant_key') AND uploader_user_id = (auth.jwt() ->> 'sub'));
GRANT SELECT, INSERT ON source_artifacts TO authenticated;

-- Parsed-object tables are server-managed. Authenticated users read tenant rows;
-- parser/vector/graph workers write with service role.
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

-- Storage object RLS for source-artifacts. Service role bypasses RLS; user
-- direct access is tenant-prefix scoped.
DROP POLICY IF EXISTS "source_artifacts_select_tenant_path" ON storage.objects;
CREATE POLICY "source_artifacts_select_tenant_path" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'source-artifacts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
  );

DROP POLICY IF EXISTS "source_artifacts_insert_tenant_path" ON storage.objects;
CREATE POLICY "source_artifacts_insert_tenant_path" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'source-artifacts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
