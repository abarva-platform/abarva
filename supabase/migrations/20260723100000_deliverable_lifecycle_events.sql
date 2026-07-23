-- Deliverable lifecycle events + version-scoped role approvals.
--
-- Phase 1 of the governed Moves deliverable lifecycle model. This migration is
-- additive except for widening deliverable_role_approvals uniqueness from
-- (deliverable_id, role) to (deliverable_id, role, version).

BEGIN;

ALTER TABLE deliverables_v2
  ADD COLUMN IF NOT EXISTS authoritative_lifecycle_state TEXT
    CHECK (authoritative_lifecycle_state IN ('human_approved','client_final')),
  ADD COLUMN IF NOT EXISTS authoritative_flag_source TEXT
    CHECK (authoritative_flag_source IN (
      'normal_flow',
      'upload_as_approved_final_exception',
      'legacy_backfill'
    )),
  ADD COLUMN IF NOT EXISTS requires_revalidation BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN deliverables_v2.authoritative_lifecycle_state IS
  'Current authoritative lifecycle state for signed_off_version. Compatibility status remains signed_off.';
COMMENT ON COLUMN deliverables_v2.authoritative_flag_source IS
  'How the authoritative pointer was established: normal flow, upload exception, or conservative legacy backfill.';
COMMENT ON COLUMN deliverables_v2.requires_revalidation IS
  'True when legacy approval lineage was inferred and must be revalidated before strict gate use.';

ALTER TABLE deliverable_versions
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'ai_generated'
    CHECK (origin IN ('ai_generated','client_uploaded','abarva_uploaded','system_extract'));

COMMENT ON COLUMN deliverable_versions.origin IS
  'Immutable origin of this deliverable version for disclosure and lifecycle projection.';

ALTER TABLE deliverable_role_approvals
  ADD COLUMN IF NOT EXISTS version INT;

UPDATE deliverable_role_approvals dra
SET version = COALESCE(d.signed_off_version, d.current_version, 1)
FROM deliverables_v2 d
WHERE dra.deliverable_id = d.id
  AND dra.version IS NULL;

UPDATE deliverable_role_approvals
SET version = 1
WHERE version IS NULL;

ALTER TABLE deliverable_role_approvals
  ALTER COLUMN version SET NOT NULL;

ALTER TABLE deliverable_role_approvals
  DROP CONSTRAINT IF EXISTS deliverable_role_approvals_deliverable_id_role_key;

CREATE UNIQUE INDEX IF NOT EXISTS deliverable_role_approvals_deliverable_role_version_key
  ON deliverable_role_approvals(deliverable_id, role, version);

CREATE INDEX IF NOT EXISTS idx_deliverable_role_approvals_deliverable_version
  ON deliverable_role_approvals(deliverable_id, version);

CREATE TABLE IF NOT EXISTS deliverable_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables_v2(id) ON DELETE CASCADE,
  version INT NOT NULL,
  workflow_run_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'version_created','submitted_for_review','review_assigned','comment_added',
    'changes_requested','approval_granted','approval_revoked',
    'marked_authoritative','authority_replaced','superseded'
  )),
  origin TEXT CHECK (origin IN ('ai_generated','client_uploaded','abarva_uploaded','system_extract')),
  reviewer_role_code TEXT CHECK (reviewer_role_code IN (
    'artifact_owner','workstream_lead','business_owner','technology_owner','architecture','data',
    'security','risk','legal','compliance','procurement','finance','executive_sponsor',
    'client_authority','abarva_quality','other'
  )),
  reviewer_role_label TEXT,
  reviewer_name TEXT,
  reviewer_organization TEXT,
  approval_scope TEXT,
  decision TEXT,
  comments TEXT,
  requested_revisions TEXT,
  source_file_checksum TEXT,
  exception_flag BOOLEAN NOT NULL DEFAULT false,
  exception_basis TEXT,
  related_version INT,
  backfill BOOLEAN NOT NULL DEFAULT false,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (event_type <> 'version_created' OR origin IS NOT NULL),
  CHECK (reviewer_role_code <> 'other' OR reviewer_role_label IS NOT NULL),
  CHECK (exception_flag = false OR exception_basis IS NOT NULL)
);

COMMENT ON TABLE deliverable_lifecycle_events IS
  'Append-only event log for governed deliverable version lifecycle decisions.';
COMMENT ON COLUMN deliverable_lifecycle_events.workflow_run_id IS
  'Operator/backfill workflow id. Enables rollback scoped to one sanctioned job run.';

CREATE INDEX IF NOT EXISTS idx_deliverable_lifecycle_events_deliverable_version
  ON deliverable_lifecycle_events(deliverable_id, version);
CREATE INDEX IF NOT EXISTS idx_deliverable_lifecycle_events_deliverable_created_at
  ON deliverable_lifecycle_events(deliverable_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliverable_lifecycle_events_workflow_run
  ON deliverable_lifecycle_events(workflow_run_id)
  WHERE workflow_run_id IS NOT NULL;

ALTER TABLE deliverable_lifecycle_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_deliverable_lifecycle_events" ON deliverable_lifecycle_events;
CREATE POLICY "service_role_all_deliverable_lifecycle_events" ON deliverable_lifecycle_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
