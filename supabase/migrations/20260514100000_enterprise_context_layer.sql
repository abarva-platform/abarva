-- ENTERPRISE CONTEXT LAYER
-- Additive, tenant-scoped schema for client-internal context.
-- This extends the existing setup-data substrate without replacing
-- data_inventory_records, enterprise_graph_*, or enterprise_context_chunks.

BEGIN;

CREATE TABLE IF NOT EXISTS enterprise_context_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  system_of_record BOOLEAN NOT NULL DEFAULT false,
  source_owner TEXT,
  steward_owner TEXT,
  sync_cadence TEXT NOT NULL DEFAULT 'manual',
  tenant_aliases TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_status TEXT NOT NULL DEFAULT 'active' CHECK (source_status IN ('active','paused','deprecated')),
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, source_system, source_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_id UUID REFERENCES enterprise_context_sources(id) ON DELETE CASCADE,
  source_file_id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_file TEXT NOT NULL,
  source_path TEXT,
  workbook_name TEXT,
  sheet_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  file_hash TEXT,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  imported_by TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, source_file_id)
);

CREATE TABLE IF NOT EXISTS enterprise_context_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  canonical_record_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_subtype TEXT,
  title TEXT NOT NULL,
  source_id UUID REFERENCES enterprise_context_sources(id) ON DELETE SET NULL,
  source_file_id UUID REFERENCES enterprise_context_source_files(id) ON DELETE SET NULL,
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  steward_owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  lifecycle_state TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active','superseded','inactive')),
  superseded_by_record_id UUID REFERENCES enterprise_context_records(id) ON DELETE SET NULL,
  payload_hash TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, canonical_record_id),
  UNIQUE (tenant_key, source_system, source_record_id)
);

CREATE TABLE IF NOT EXISTS enterprise_context_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  record_id UUID NOT NULL REFERENCES enterprise_context_records(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  fact_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  fact_text TEXT,
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  lifecycle_state TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active','superseded','inactive')),
  valid_from DATE,
  valid_through DATE,
  supersedes_fact_id UUID REFERENCES enterprise_context_facts(id) ON DELETE SET NULL,
  value_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, record_id, fact_key, value_hash)
);

CREATE TABLE IF NOT EXISTS enterprise_context_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  relationship_key TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  from_record_id UUID REFERENCES enterprise_context_records(id) ON DELETE SET NULL,
  to_record_id UUID REFERENCES enterprise_context_records(id) ON DELETE SET NULL,
  from_external_id TEXT,
  to_external_id TEXT,
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  lifecycle_state TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active','superseded','inactive')),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, relationship_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  evidence_key TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  record_id UUID REFERENCES enterprise_context_records(id) ON DELETE CASCADE,
  fact_id UUID REFERENCES enterprise_context_facts(id) ON DELETE CASCADE,
  citation_label TEXT NOT NULL,
  citation_locator TEXT,
  evidence_pointer TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  evidence_usable BOOLEAN NOT NULL DEFAULT false,
  excerpt TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  lifecycle_state TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active','superseded','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, evidence_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  issue_key TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaged','resolved','accepted_risk')),
  affected_record_id UUID REFERENCES enterprise_context_records(id) ON DELETE CASCADE,
  affected_fact_id UUID REFERENCES enterprise_context_facts(id) ON DELETE CASCADE,
  affected_relationship_id UUID REFERENCES enterprise_context_relationships(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  steward_owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, issue_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_stewardship_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  task_key TEXT NOT NULL,
  issue_id UUID REFERENCES enterprise_context_quality_issues(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','done','accepted_risk')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assigned_owner TEXT,
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  due_date DATE,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, task_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  snapshot_key TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, snapshot_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_template_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  run_key TEXT NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('generate_template','generate_synthetic','dry_run','apply','verify','refresh')),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed','failed')),
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  source_root TEXT,
  workbook_count INTEGER NOT NULL DEFAULT 0 CHECK (workbook_count >= 0),
  records_seen INTEGER NOT NULL DEFAULT 0 CHECK (records_seen >= 0),
  records_loaded INTEGER NOT NULL DEFAULT 0 CHECK (records_loaded >= 0),
  quality_issues_created INTEGER NOT NULL DEFAULT 0 CHECK (quality_issues_created >= 0),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, run_key)
);

CREATE TABLE IF NOT EXISTS enterprise_context_chunk_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  queue_key TEXT NOT NULL,
  chunk_id TEXT,
  record_id UUID REFERENCES enterprise_context_records(id) ON DELETE CASCADE,
  fact_id UUID REFERENCES enterprise_context_facts(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES enterprise_context_evidence(id) ON DELETE CASCADE,
  operation TEXT NOT NULL DEFAULT 'upsert' CHECK (operation IN ('upsert','deactivate','rechunk','embed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','skipped')),
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_file TEXT,
  source_sheet TEXT,
  source_row_number INTEGER CHECK (source_row_number IS NULL OR source_row_number > 0),
  owner TEXT,
  last_synced_at TIMESTAMPTZ,
  last_validated_at DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','unknown')),
  evidence_pointer TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, queue_key)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_context_sources_tenant_status ON enterprise_context_sources(tenant_key, source_status);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_source_files_tenant_source ON enterprise_context_source_files(tenant_key, source_system);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_records_tenant_type ON enterprise_context_records(tenant_key, record_type, lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_records_source ON enterprise_context_records(tenant_key, source_system, source_record_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_records_freshness ON enterprise_context_records(tenant_key, freshness_status);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_facts_tenant_type ON enterprise_context_facts(tenant_key, fact_type, lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_facts_record ON enterprise_context_facts(tenant_key, record_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_relationships_type ON enterprise_context_relationships(tenant_key, relationship_type, lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_evidence_record ON enterprise_context_evidence(tenant_key, record_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_evidence_fact ON enterprise_context_evidence(tenant_key, fact_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_quality_status ON enterprise_context_quality_issues(tenant_key, status, severity);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_stewardship_status ON enterprise_context_stewardship_tasks(tenant_key, status, priority);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_snapshots_tenant_type ON enterprise_context_snapshots(tenant_key, snapshot_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_template_runs_tenant_started ON enterprise_context_template_runs(tenant_key, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunk_queue_status ON enterprise_context_chunk_queue(tenant_key, status, operation);

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'enterprise_context_sources',
    'enterprise_context_source_files',
    'enterprise_context_records',
    'enterprise_context_facts',
    'enterprise_context_relationships',
    'enterprise_context_evidence',
    'enterprise_context_quality_issues',
    'enterprise_context_stewardship_tasks',
    'enterprise_context_snapshots',
    'enterprise_context_template_runs',
    'enterprise_context_chunk_queue'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS svc_all ON %I', tbl);
    EXECUTE format('CREATE POLICY svc_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_read ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_read ON %I FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_insert ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_insert ON %I FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_update ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_update ON %I FOR UPDATE TO authenticated USING (can_write_tenant_by_key(tenant_key)) WITH CHECK (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_delete ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_delete ON %I FOR DELETE TO authenticated USING (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', tbl);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
