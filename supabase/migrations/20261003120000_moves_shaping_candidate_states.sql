-- Allow honest early-stage Move state in the canonical engagement row.
-- Existing lifecycle and origin values remain valid; no existing rows change.

BEGIN;

ALTER TABLE engagements
  DROP CONSTRAINT IF EXISTS engagements_lifecycle_state_check;

ALTER TABLE engagements
  ADD CONSTRAINT engagements_lifecycle_state_check
  CHECK (
    lifecycle_state IS NULL
    OR lifecycle_state IN (
      'draft',
      'shaping',
      'submitted_for_approval',
      'approved',
      'rejected',
      'paused',
      'canceled',
      'completed',
      'archived'
    )
  );

ALTER TABLE engagements
  DROP CONSTRAINT IF EXISTS engagements_origin_source_check;

ALTER TABLE engagements
  ADD CONSTRAINT engagements_origin_source_check
  CHECK (
    origin_source IS NULL
    OR origin_source IN (
      'tower_triggered',
      'user_initiated',
      'intelligence_promoted',
      'intelligence_candidate'
    )
  );

COMMIT;
