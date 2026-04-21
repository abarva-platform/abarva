-- Migration 023 · Maestro profile + relationship-note subject_type
-- Idempotent.

BEGIN;

ALTER TABLE persons ADD COLUMN IF NOT EXISTS maestro_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS maestro_profile_updated_at TIMESTAMPTZ;

-- subject_type on relationship_notes distinguishes notes about sponsors vs about Maestros.
ALTER TABLE relationship_notes ADD COLUMN IF NOT EXISTS subject_type TEXT;

-- Backfill existing rows as 'sponsor' before locking the constraint
UPDATE relationship_notes SET subject_type = 'sponsor' WHERE subject_type IS NULL;

DO $$ BEGIN
  ALTER TABLE relationship_notes
    ALTER COLUMN subject_type SET NOT NULL,
    ALTER COLUMN subject_type SET DEFAULT 'sponsor';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE relationship_notes
    ADD CONSTRAINT relationship_notes_subject_type_check
    CHECK (subject_type IN ('sponsor', 'maestro', 'observer'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
