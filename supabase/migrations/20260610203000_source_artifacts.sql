-- Source File Cabinet / Artifact Vault — durable registry for every artifact tied to a
-- Source event (generated deliverables, uploaded evidence, templates, session artifacts,
-- approval packets). Bytes live in Azure Blob; this table is the metadata registry that
-- the File Cabinet UI reads. Versioned: regenerating never overwrites — a new version row
-- is created and the prior current row is marked superseded.
--
-- Control-plane scoped; tenant isolation by client_key (+ client_id).

CREATE TABLE IF NOT EXISTS source_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  tenant_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  sourcing_stage TEXT NULL,
  -- grouping for the File Cabinet: generated | upload | template | session | approval
  artifact_group TEXT NOT NULL DEFAULT 'generated'
    CHECK (artifact_group IN ('generated', 'upload', 'template', 'session', 'approval')),
  artifact_type TEXT NOT NULL,          -- e.g. 'rfp_package' | 'pricing_workbook' | 'approval_packet'
  artifact_family TEXT NULL,            -- e.g. evidence family for uploads
  title TEXT NOT NULL,
  description TEXT NULL,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,            -- docx | xlsx | pptx | pdf | html | md | csv | json
  blob_container TEXT NOT NULL,
  blob_path TEXT NOT NULL,
  file_size BIGINT NULL,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','preliminary','issue_ready','client_to_complete',
      'legal_review_required','procurement_review_required','approved','superseded','retired','blocked')),
  generated_by TEXT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_basis TEXT NULL,
  confidence TEXT NULL,
  citation_ready BOOLEAN NOT NULL DEFAULT false,
  evidence_families_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_register_id TEXT NULL,
  context_bundle_trace_id TEXT NULL,
  approval_state TEXT NULL,
  approved_by TEXT NULL,
  approved_at TIMESTAMPTZ NULL,
  maestro_override_id TEXT NULL,
  missing_inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  client_complete_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  supersedes_artifact_id UUID NULL,
  superseded_by_artifact_id UUID NULL,
  -- 'current' is the latest live version for (event, artifact_type); 'superseded'/'retired' are history.
  lifecycle_state TEXT NOT NULL DEFAULT 'current'
    CHECK (lifecycle_state IN ('current', 'superseded', 'retired')),
  blob_sha256 TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing Azure environments already have the older Source artifact registry
-- (`20260430220000_source_artifact_registry.sql`). `CREATE TABLE IF NOT EXISTS`
-- intentionally leaves that table in place, so this migration must bridge it to
-- the File Cabinet contract additively instead of assuming a fresh table.
ALTER TABLE source_artifacts
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS sourcing_stage TEXT,
  ADD COLUMN IF NOT EXISTS artifact_group TEXT NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS artifact_type TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_format TEXT,
  ADD COLUMN IF NOT EXISTS blob_container TEXT,
  ADD COLUMN IF NOT EXISTS blob_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS generated_by TEXT,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source_basis TEXT,
  ADD COLUMN IF NOT EXISTS confidence TEXT,
  ADD COLUMN IF NOT EXISTS citation_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_families_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_register_id TEXT,
  ADD COLUMN IF NOT EXISTS context_bundle_trace_id TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS maestro_override_id TEXT,
  ADD COLUMN IF NOT EXISTS missing_inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_complete_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supersedes_artifact_id UUID,
  ADD COLUMN IF NOT EXISTS superseded_by_artifact_id UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS blob_sha256 TEXT;

ALTER TABLE source_artifacts
  ALTER COLUMN artifact_family DROP NOT NULL,
  ALTER COLUMN stage_key DROP NOT NULL,
  ALTER COLUMN artifact_kind DROP NOT NULL,
  ALTER COLUMN source_origin DROP NOT NULL,
  ALTER COLUMN source_format DROP NOT NULL,
  ALTER COLUMN original_name DROP NOT NULL,
  ALTER COLUMN blob_uri DROP NOT NULL,
  ALTER COLUMN uploader_user_id DROP NOT NULL,
  ALTER COLUMN mime_type DROP NOT NULL,
  ALTER COLUMN size_bytes DROP NOT NULL,
  ALTER COLUMN sha256 DROP NOT NULL,
  ALTER COLUMN created_by DROP NOT NULL;

UPDATE source_artifacts
SET
  artifact_type = COALESCE(artifact_type, artifact_kind, artifact_family, 'source_artifact'),
  title = COALESCE(title, original_name, artifact_kind, artifact_family, 'Source artifact'),
  file_name = COALESCE(file_name, original_name, NULLIF(split_part(COALESCE(blob_uri, blob_path, ''), '/', greatest(1, array_length(string_to_array(COALESCE(blob_uri, blob_path, ''), '/'), 1))), ''), 'artifact'),
  file_format = COALESCE(
    file_format,
    CASE source_format
      WHEN 'markdown' THEN 'md'
      WHEN 'unknown' THEN 'json'
      ELSE source_format
    END,
    'json'
  ),
  blob_container = COALESCE(blob_container, 'source-artifacts'),
  blob_path = COALESCE(blob_path, blob_uri),
  file_size = COALESCE(file_size, size_bytes),
  status = COALESCE(status, approval_state, 'draft'),
  blob_sha256 = COALESCE(blob_sha256, sha256),
  lifecycle_state = COALESCE(lifecycle_state, CASE WHEN deleted_at IS NULL THEN 'current' ELSE 'retired' END),
  sourcing_stage = COALESCE(sourcing_stage, stage_key),
  artifact_group = COALESCE(
    artifact_group,
    CASE source_origin
      WHEN 'uploaded' THEN 'upload'
      WHEN 'generated' THEN 'generated'
      ELSE 'generated'
    END
  );

UPDATE source_artifacts artifacts
SET client_id = clients.id
FROM source_events events
JOIN clients
  ON clients.tenant_key = events.client_key
WHERE artifacts.client_id IS NULL
  AND (
    artifacts.source_event_row_id = events.id
    OR artifacts.source_event_id = events.id::text
  );

-- File Cabinet hot path: all artifacts for an event, newest first.
CREATE INDEX IF NOT EXISTS idx_source_artifacts_event
  ON source_artifacts (source_event_id, created_at DESC);
-- Versioning lookup: the current version for an (event, type).
CREATE INDEX IF NOT EXISTS idx_source_artifacts_versioning
  ON source_artifacts (source_event_id, artifact_type, lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_source_artifacts_tenant
  ON source_artifacts (client_id, created_at DESC);

ALTER TABLE source_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_artifacts" ON source_artifacts;
CREATE POLICY "service_role_all_source_artifacts" ON source_artifacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_artifacts" ON source_artifacts;
CREATE POLICY "authenticated_read_source_artifacts" ON source_artifacts
  FOR SELECT TO authenticated
  USING (tenant_key = (auth.jwt() ->> 'tenant_key'));
