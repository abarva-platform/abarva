-- Moves File Cabinet / Artifact Vault — durable artifact registry (PR-1).
-- Every Strategic Move artifact (generated deliverable, uploaded evidence,
-- session output, approval packet, historical version) is registered here with
-- its Azure Blob location, version lineage, status, governance, and quality.
-- No Move artifact may exist only in browser downloads or temp output.

BEGIN;

CREATE TABLE IF NOT EXISTS public.move_artifacts (
  artifact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,                       -- client_id (uuid as text)
  tenant_key TEXT NOT NULL,                       -- e.g. skyharbor-air
  move_id UUID NOT NULL,
  phase INT,
  archetype TEXT,
  artifact_type TEXT NOT NULL,                    -- program_charter, discovery_report, ...
  artifact_family TEXT NOT NULL DEFAULT 'generated_deliverable'
    CHECK (artifact_family IN (
      'generated_deliverable','uploaded_evidence','template',
      'session_artifact','approval_artifact','historical_version'
    )),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,                       -- docx, html, xlsx, pptx, md, pdf
  blob_container TEXT NOT NULL,
  blob_path TEXT NOT NULL,                         -- canonical moves/{tenant_key}/{move_id}/...
  blob_sha256 TEXT,
  file_size INT,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft','preliminary','review_required','aligned','approved',
      'client_to_complete','evidence_missing','legal_review_required',
      'board_ready','superseded','retired','blocked'
    )),
  generated_by TEXT,
  generated_at TIMESTAMPTZ,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ,
  source_basis TEXT,
  confidence TEXT,
  citation_ready BOOLEAN NOT NULL DEFAULT false,
  quality_score NUMERIC CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 100),
  unsupported_claims_count INT NOT NULL DEFAULT 0,
  supersedes_artifact_id UUID REFERENCES public.move_artifacts(artifact_id) ON DELETE SET NULL,
  superseded_by_artifact_id UUID REFERENCES public.move_artifacts(artifact_id) ON DELETE SET NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'current'
    CHECK (lifecycle_state IN ('current','superseded','retired')),
  -- Governance + extras live here (source_register, context_bundle_trace_id,
  -- evidence_families_used, missing_inputs, client_complete_items, assumptions,
  -- approval_state/approved_by/approved_at, maestro_override_id).
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS move_artifacts_drawer_idx
  ON public.move_artifacts (tenant_key, move_id, artifact_family, lifecycle_state, created_at DESC);
CREATE INDEX IF NOT EXISTS move_artifacts_type_version_idx
  ON public.move_artifacts (move_id, artifact_type, version DESC);

ALTER TABLE public.move_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_move_artifacts ON public.move_artifacts;
CREATE POLICY service_role_all_move_artifacts ON public.move_artifacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_read_move_artifacts ON public.move_artifacts;
CREATE POLICY authenticated_read_move_artifacts ON public.move_artifacts
  FOR SELECT TO authenticated
  USING (tenant_key = (auth.jwt() ->> 'tenant_key'));

GRANT SELECT ON public.move_artifacts TO authenticated;

COMMIT;
