-- Pilot private data-plane ingestion load ledger · T357-T360
--
-- Durable tenant-scoped state for upload runs, file manifests, template/mapping
-- versions, clarification, approval, commit, and rollback/unload evidence.
-- This is additive and keeps writes behind the existing data-plane adapters.

BEGIN;

CREATE TABLE IF NOT EXISTS pilot_ingestion_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  template_key TEXT NOT NULL,
  template_version TEXT NOT NULL,
  dimension TEXT NOT NULL,
  manifest_path TEXT NOT NULL,
  validation_rule_version TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','retired')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, template_key, template_version)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_mapping_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  template_version_id UUID NOT NULL REFERENCES pilot_ingestion_template_versions(id) ON DELETE CASCADE,
  profile_key TEXT NOT NULL,
  profile_version TEXT NOT NULL,
  source_system TEXT NOT NULL,
  mapping_sha256 TEXT NOT NULL,
  required_columns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  optional_columns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','retired')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, template_version_id, profile_key, profile_version)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_upload_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  run_key TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  initiated_by_user_id TEXT NOT NULL,
  attestation_version TEXT NOT NULL,
  template_version_id UUID REFERENCES pilot_ingestion_template_versions(id) ON DELETE SET NULL,
  mapping_profile_id UUID REFERENCES pilot_ingestion_mapping_profiles(id) ON DELETE SET NULL,
  source_system TEXT NOT NULL,
  load_intent TEXT NOT NULL DEFAULT 'pilot_rehearsal'
    CHECK (load_intent IN ('pilot_rehearsal','initial_load','incremental_refresh','correction','rollback_replay')),
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN (
      'uploaded',
      'scanning',
      'quarantined',
      'parsing',
      'validation_failed',
      'awaiting_clarification',
      'awaiting_approval',
      'approved',
      'rejected',
      'committing',
      'committed',
      'commit_failed',
      'rollback_requested',
      'rolling_back',
      'rolled_back'
    )),
  row_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_score NUMERIC(5,2) CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
  duplicate_of_run_id UUID REFERENCES pilot_ingestion_upload_runs(id) ON DELETE SET NULL,
  error_report JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (tenant_key, run_key),
  UNIQUE (tenant_key, idempotency_key)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_file_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  upload_run_id UUID NOT NULL REFERENCES pilot_ingestion_upload_runs(id) ON DELETE CASCADE,
  file_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  blob_uri TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  parse_cache_key TEXT,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  mime_type TEXT,
  manifest_role TEXT NOT NULL DEFAULT 'raw'
    CHECK (manifest_role IN ('raw','parsed','preview','evidence','quarantine','audit_export')),
  storage_state TEXT NOT NULL DEFAULT 'landed'
    CHECK (storage_state IN ('landed','quarantined','promoted','deleted')),
  malware_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (malware_status IN ('pending','clean','infected','scan_failed','not_required')),
  sensitive_data_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sensitive_data_status IN ('pending','allowed','quarantined','released')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, upload_run_id, file_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_file_manifests_parse_cache_unique
  ON pilot_ingestion_file_manifests(tenant_key, parse_cache_key)
  WHERE parse_cache_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS pilot_ingestion_quarantine_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  upload_run_id UUID NOT NULL REFERENCES pilot_ingestion_upload_runs(id) ON DELETE CASCADE,
  file_manifest_id UUID REFERENCES pilot_ingestion_file_manifests(id) ON DELETE SET NULL,
  case_key TEXT NOT NULL,
  reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','released','rejected','hard_deleted')),
  decision_by_user_id TEXT,
  decision_note TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, case_key)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_clarification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  upload_run_id UUID NOT NULL REFERENCES pilot_ingestion_upload_runs(id) ON DELETE CASCADE,
  request_key TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','answered','waived','closed')),
  field_key TEXT,
  question TEXT NOT NULL,
  requested_by_user_id TEXT NOT NULL,
  answered_by_user_id TEXT,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  UNIQUE (tenant_key, request_key)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  upload_run_id UUID NOT NULL REFERENCES pilot_ingestion_upload_runs(id) ON DELETE CASCADE,
  decision_key TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK (decision IN ('approved','rejected','needs_clarification')),
  decided_by_user_id TEXT NOT NULL,
  decision_note TEXT,
  preview_sha256 TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, decision_key),
  UNIQUE (tenant_key, upload_run_id, decision)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_load_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  upload_run_id UUID NOT NULL REFERENCES pilot_ingestion_upload_runs(id) ON DELETE RESTRICT,
  approval_decision_id UUID NOT NULL REFERENCES pilot_ingestion_approval_decisions(id) ON DELETE RESTRICT,
  commit_key TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  committed_by_user_id TEXT NOT NULL,
  target_surface TEXT NOT NULL
    CHECK (target_surface IN ('setup','intelligence','moves','source','tower','cross_surface')),
  status TEXT NOT NULL DEFAULT 'committed'
    CHECK (status IN ('committing','committed','commit_failed','rollback_requested','rolling_back','rolled_back')),
  records_inserted INTEGER NOT NULL DEFAULT 0 CHECK (records_inserted >= 0),
  records_updated INTEGER NOT NULL DEFAULT 0 CHECK (records_updated >= 0),
  records_skipped INTEGER NOT NULL DEFAULT 0 CHECK (records_skipped >= 0),
  commit_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rolled_back_at TIMESTAMPTZ,
  UNIQUE (tenant_key, commit_key),
  UNIQUE (tenant_key, idempotency_key)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_load_commit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  load_commit_id UUID NOT NULL REFERENCES pilot_ingestion_load_commits(id) ON DELETE CASCADE,
  target_table TEXT NOT NULL,
  target_record_key TEXT NOT NULL,
  operation TEXT NOT NULL
    CHECK (operation IN ('insert','update','skip','delete')),
  prior_snapshot JSONB,
  written_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  unload_status TEXT NOT NULL DEFAULT 'active'
    CHECK (unload_status IN ('active','unloaded','unload_failed','not_required')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, load_commit_id, target_table, target_record_key)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_rollback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  load_commit_id UUID NOT NULL REFERENCES pilot_ingestion_load_commits(id) ON DELETE RESTRICT,
  rollback_key TEXT NOT NULL,
  requested_by_user_id TEXT NOT NULL,
  approved_by_user_id TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','running','completed','failed','rejected')),
  rollback_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (tenant_key, rollback_key)
);

CREATE TABLE IF NOT EXISTS pilot_ingestion_audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  export_key TEXT NOT NULL,
  upload_run_id UUID REFERENCES pilot_ingestion_upload_runs(id) ON DELETE SET NULL,
  load_commit_id UUID REFERENCES pilot_ingestion_load_commits(id) ON DELETE SET NULL,
  requested_by_user_id TEXT NOT NULL,
  export_scope TEXT NOT NULL
    CHECK (export_scope IN ('upload_run','load_commit','tenant_window')),
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, export_key)
);

CREATE INDEX IF NOT EXISTS idx_pilot_upload_runs_tenant_status
  ON pilot_ingestion_upload_runs(tenant_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_upload_runs_duplicate
  ON pilot_ingestion_upload_runs(tenant_key, duplicate_of_run_id)
  WHERE duplicate_of_run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilot_file_manifests_tenant_sha
  ON pilot_ingestion_file_manifests(tenant_key, sha256, manifest_role);

CREATE INDEX IF NOT EXISTS idx_pilot_quarantine_open
  ON pilot_ingestion_quarantine_cases(tenant_key, created_at DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_pilot_clarifications_open
  ON pilot_ingestion_clarification_requests(tenant_key, upload_run_id, severity)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_pilot_approvals_run_decided
  ON pilot_ingestion_approval_decisions(tenant_key, upload_run_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_load_commits_tenant_status
  ON pilot_ingestion_load_commits(tenant_key, status, committed_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_commit_items_unload
  ON pilot_ingestion_load_commit_items(tenant_key, load_commit_id, unload_status);

CREATE INDEX IF NOT EXISTS idx_pilot_rollback_status
  ON pilot_ingestion_rollback_requests(tenant_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_audit_exports_tenant_created
  ON pilot_ingestion_audit_exports(tenant_key, created_at DESC);

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'pilot_ingestion_template_versions',
    'pilot_ingestion_mapping_profiles',
    'pilot_ingestion_upload_runs',
    'pilot_ingestion_file_manifests',
    'pilot_ingestion_quarantine_cases',
    'pilot_ingestion_clarification_requests',
    'pilot_ingestion_approval_decisions',
    'pilot_ingestion_load_commits',
    'pilot_ingestion_load_commit_items',
    'pilot_ingestion_rollback_requests',
    'pilot_ingestion_audit_exports'
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
    EXECUTE format('REVOKE DELETE ON %I FROM anon, authenticated', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON %I TO authenticated', tbl);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Down migration:
-- BEGIN;
-- DROP TABLE IF EXISTS pilot_ingestion_audit_exports;
-- DROP TABLE IF EXISTS pilot_ingestion_rollback_requests;
-- DROP TABLE IF EXISTS pilot_ingestion_load_commit_items;
-- DROP TABLE IF EXISTS pilot_ingestion_load_commits;
-- DROP TABLE IF EXISTS pilot_ingestion_approval_decisions;
-- DROP TABLE IF EXISTS pilot_ingestion_clarification_requests;
-- DROP TABLE IF EXISTS pilot_ingestion_quarantine_cases;
-- DROP TABLE IF EXISTS pilot_ingestion_file_manifests;
-- DROP TABLE IF EXISTS pilot_ingestion_upload_runs;
-- DROP TABLE IF EXISTS pilot_ingestion_mapping_profiles;
-- DROP TABLE IF EXISTS pilot_ingestion_template_versions;
-- COMMIT;
