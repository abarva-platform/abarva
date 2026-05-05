-- Wave 3b: engagement_deliverables rehabilitation — add engagement_id UUID column.
--
-- Adds engagement_id column (nullable FK to engagements), attempts backfill
-- from phase_id → engagement_phases.phase_number where the client_id slug
-- can be resolved. Unresolvable rows are left NULL (no silent deletion).
--
-- Reversal: ALTER TABLE engagement_deliverables DROP COLUMN IF EXISTS engagement_id;
-- (must drop move_artifact_index VIEW first)

BEGIN;

ALTER TABLE engagement_deliverables
  ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_engagement_deliverables_engagement_id
  ON engagement_deliverables(engagement_id);

COMMIT;
