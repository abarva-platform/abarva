-- source_events: explicit sourcing motion for Door 1 vs Door 2.
--
-- New Source events created through a first-class Door 1 front door must not
-- depend on regex matching the event name/description after the fact. This
-- nullable column stores the creation-time motion. Existing rows remain NULL
-- and continue through the established profile/category/text fallback chain.

ALTER TABLE source_events
  ADD COLUMN IF NOT EXISTS sourcing_motion TEXT;

ALTER TABLE source_events
  DROP CONSTRAINT IF EXISTS source_events_sourcing_motion_check;

ALTER TABLE source_events
  ADD CONSTRAINT source_events_sourcing_motion_check
  CHECK (
    sourcing_motion IS NULL
    OR sourcing_motion IN ('competitive_rfp', 'contract_optimization')
  );

COMMENT ON COLUMN source_events.sourcing_motion IS
  'Explicit Source workflow motion selected at event creation. NULL for older rows that use resolver fallbacks.';

CREATE INDEX IF NOT EXISTS source_events_sourcing_motion_idx
  ON source_events (client_key, sourcing_motion)
  WHERE sourcing_motion IS NOT NULL;
