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
