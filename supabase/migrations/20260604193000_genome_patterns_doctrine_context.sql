-- Healthcare modernization substrate alignment.
--
-- Adds a rich doctrine payload for decision-grade corpus patterns while
-- preserving the existing normalized columns and `data` classification blob.
--
-- Manual rollback, if needed:
--   DROP INDEX IF EXISTS idx_genome_patterns_doctrine_context;
--   ALTER TABLE genome_patterns DROP COLUMN IF EXISTS doctrine_context;

ALTER TABLE genome_patterns
  ADD COLUMN IF NOT EXISTS doctrine_context JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_genome_patterns_doctrine_context
  ON genome_patterns USING GIN (doctrine_context);

COMMENT ON COLUMN genome_patterns.doctrine_context IS
  'Rich decision-grade fields per the master-prompt schema. Empty {} for legacy patterns loaded before 2026-06-04.';

NOTIFY pgrst, 'reload schema';
