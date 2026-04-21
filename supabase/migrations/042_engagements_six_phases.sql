-- Relax engagements.current_phase CHECK from 0-4 (013-era 5-phase model)
-- to 0-5 (Programs 6-phase spec: Origination → Charter → Diagnose →
-- Design → Execute → Verify). Also ensures current_phase allows NULL
-- so Intelligence-originated drafts can exist before phase assignment.
--
-- Idempotent: drops the known old constraint name and recreates. Safe
-- to re-run.

DO $$ BEGIN
  -- Drop the old check constraint if it exists under any of its common names
  BEGIN
    ALTER TABLE engagements DROP CONSTRAINT IF EXISTS engagements_current_phase_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

ALTER TABLE engagements
  ADD CONSTRAINT engagements_current_phase_check
  CHECK (current_phase IS NULL OR (current_phase >= 0 AND current_phase <= 5));
