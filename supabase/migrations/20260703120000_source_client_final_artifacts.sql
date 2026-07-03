-- Source Client-Final Artifacts
--
-- Governance model:
-- AbarVa generates the working draft. The client reviews, edits, and uploads
-- the approved final. The uploaded client-final artifact becomes the
-- authoritative deliverable of record while generated drafts remain available
-- as lineage/history.

BEGIN;

ALTER TABLE source_artifacts
  ADD COLUMN IF NOT EXISTS is_client_final BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_current_authoritative BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_generated_artifact_id UUID NULL REFERENCES source_artifacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_final_uploaded_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS client_final_uploaded_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS client_final_accepted_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS client_final_accepted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS client_final_note TEXT NULL,
  ADD COLUMN IF NOT EXISTS client_final_review_meeting_date DATE NULL,
  ADD COLUMN IF NOT EXISTS client_final_stakeholder_group TEXT NULL,
  ADD COLUMN IF NOT EXISTS client_final_change_summary JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE source_artifacts
  DROP CONSTRAINT IF EXISTS source_artifacts_status_check;

ALTER TABLE source_artifacts
  ADD CONSTRAINT source_artifacts_status_check
  CHECK (status IN (
    'draft',
    'preliminary',
    'issue_ready',
    'client_to_complete',
    'legal_review_required',
    'procurement_review_required',
    'approved',
    'client_final',
    'superseded',
    'retired',
    'blocked'
  ));

CREATE INDEX IF NOT EXISTS idx_source_artifacts_client_final_current
  ON source_artifacts (source_event_id, artifact_type, is_client_final, lifecycle_state)
  WHERE is_client_final = true;

CREATE INDEX IF NOT EXISTS idx_source_artifacts_authoritative
  ON source_artifacts (source_event_id, artifact_type, is_current_authoritative, lifecycle_state)
  WHERE is_current_authoritative = true;

COMMENT ON COLUMN source_artifacts.is_client_final IS
  'True when this row is a client-uploaded final artifact of record, not an AbarVa-generated working draft.';

COMMENT ON COLUMN source_artifacts.is_current_authoritative IS
  'True for the current artifact version Source should resolve by default for exports, gates, and downstream work.';

COMMENT ON COLUMN source_artifacts.source_generated_artifact_id IS
  'Generated AbarVa draft/version that the client-final upload supersedes or derives from.';

COMMENT ON COLUMN source_artifacts.client_final_change_summary IS
  'Optional metadata-only change summary. Detailed redline/diff is not required for accepting client final.';

COMMIT;
