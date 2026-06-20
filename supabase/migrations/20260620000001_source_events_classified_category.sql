-- source_events: classified_category — Slice 1.1 (classify-at-intake)
--
-- Stores the deterministic categoryId from classifySourcingEvent at event
-- creation time, so subsequent generate calls can read the pre-computed
-- classification without re-running the classifier.
--
-- The column is nullable: existing events retain NULL until the next
-- generate call sets the live classification in the envelope. New events
-- set it at creation. No backfill is required because recommendation-stage.ts
-- uses a three-level fallback: classified_category → live classifier → archetype.
--
-- PREREQUISITE: 20260430150000_source_events.sql (source_events table).

ALTER TABLE source_events
  ADD COLUMN IF NOT EXISTS classified_category TEXT;

COMMENT ON COLUMN source_events.classified_category IS
  'Deterministic categoryId from classifySourcingEvent at intake time '
  '(e.g. ''ams'', ''erp_si''). NULL for events created before Slice 1.1.';
