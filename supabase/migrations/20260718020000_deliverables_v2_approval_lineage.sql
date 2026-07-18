-- Deliverable approval lineage — real "client approved" pointer.
--
-- Today deliverables_v2.status can say 'signed_off', but nothing durable
-- records WHICH version was approved: a later AI regeneration bumps
-- current_version and overwrites status back to 'draft', silently losing
-- any record of what a human previously approved. And no column links a
-- deliverable to a client-uploaded replacement file (move_artifacts already
-- supports an artifact_family='generated_deliverable' row for this; it was
-- simply never linked back to deliverables_v2).
--
-- Additive only. signed_off_version and approved_artifact_id are both
-- nullable; existing rows are unaffected until the new approval action sets
-- them. No backfill, no inference of historical approvals.

BEGIN;

ALTER TABLE deliverables_v2
  ADD COLUMN IF NOT EXISTS signed_off_version INT;

COMMENT ON COLUMN deliverables_v2.signed_off_version IS
  'Version number that was actually approved (signOffDeliverable). Independent of current_version, which keeps advancing on regeneration -- this column is the durable record of what a human approved and survives later drafts until a newer version is explicitly approved.';

ALTER TABLE deliverables_v2
  ADD COLUMN IF NOT EXISTS approved_artifact_id UUID REFERENCES public.move_artifacts(artifact_id);

COMMENT ON COLUMN deliverables_v2.approved_artifact_id IS
  'Set when the client approved by uploading an edited replacement rather than approving the AI-generated text as-is. Points at the move_artifacts row (artifact_family=generated_deliverable) holding the uploaded file. Null when approved as-is.';

CREATE INDEX IF NOT EXISTS idx_deliverables_v2_approved_artifact_id
  ON deliverables_v2(approved_artifact_id)
  WHERE approved_artifact_id IS NOT NULL;

COMMIT;
