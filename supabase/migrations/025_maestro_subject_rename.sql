-- Migration 025 · Pack F Part 2 — semantic rename 'maestro' → 'user' on
-- relationship_notes.subject_type. Column names on persons (maestro_profile,
-- maestro_profile_updated_at) kept as-is in this pass to avoid a deploy
-- window where old code hits renamed columns; revisit in a dedicated
-- backwards-compatible pass with shadow columns.

BEGIN;

-- 1. Convert existing 'maestro' rows before tightening the constraint.
UPDATE relationship_notes SET subject_type = 'user' WHERE subject_type = 'maestro';

-- 2. Replace the CHECK constraint so 'maestro' is no longer a legal value.
ALTER TABLE relationship_notes DROP CONSTRAINT IF EXISTS relationship_notes_subject_type_check;
DO $$ BEGIN
  ALTER TABLE relationship_notes
    ADD CONSTRAINT relationship_notes_subject_type_check
    CHECK (subject_type IN ('sponsor', 'user', 'observer'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- 3. Default for new rows stays 'sponsor' (unchanged from migration 023).

NOTIFY pgrst, 'reload schema';

COMMIT;
