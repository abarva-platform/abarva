-- Strategic Moves · 6-phase doctrine remap
--
-- Doctrine reference:
--   docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md
--
-- AbarVa Strategic Moves runs across six phases (P0 Originate ..
-- P5 Mobilize & Handoff). Tower owns downstream execution tracking.
-- The legacy 8-phase model (P0..P7) is collapsed to 6 phases:
--
--   0 Originate              -> 0 Originate
--   1 Charter                -> 1 Charter
--   2 Diagnose               -> 2 Discover & Diagnose
--   3 Solution Design        -> 3 Design Future State
--   4 Build                  -> 4 Roadmap & Business Case
--   5 Execute                -> 5 Mobilize & Handoff
--   6 Verify                 -> 5 Mobilize & Handoff (status='complete')
--   7 Handoff                -> 5 Mobilize & Handoff (status='handed_off')
--
-- This migration:
--   1) Stamps a per-engagement audit row in `program_audit_log` (best
--      effort) for every move whose phase is being remapped.
--   2) Updates `engagements.current_phase` so any value > 5 is clamped
--      to 5, and updates `status` for legacy 6/7 moves so downstream
--      readers can distinguish completed vs handed-off.
--   3) Clamps `phase_number` and `phase` columns on adjacent tables to
--      [0..5] so views/joins against engagements stay consistent.
--   4) Replaces the engagements current_phase CHECK constraint with the
--      P5 ceiling (0..5).
--
-- Idempotent: re-running on a database that has already been remapped
-- is a no-op (clauses use UPDATE ... WHERE current_phase > 5, etc.).

-- ── 0 · audit row helper ──────────────────────────────────────────────
DO $$
DECLARE
  has_audit_table boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'program_audit_log'
  ) INTO has_audit_table;

  IF has_audit_table THEN
    INSERT INTO program_audit_log (
      tenant_key,
      program_id,
      engagement_id,
      action,
      from_state,
      to_state,
      rationale,
      evidence_refs,
      created_at
    )
    SELECT
      COALESCE(c.slug, c.id::text, 'system'),
      e.id::text,
      e.id,
      'phase_model_v2_remap',
      'P' || e.current_phase::text,
      CASE
        WHEN e.current_phase = 6 THEN 'P5 (status=complete)'
        WHEN e.current_phase = 7 THEN 'P5 (status=handed_off)'
        ELSE 'P5'
      END,
      '[phase_model_v2_remap_2026_05_05] Remapped from legacy 8-phase model '
        || 'to 6-phase doctrine (PHASE_MODEL_V2_DOCTRINE.md). '
        || 'Tower owns post-P5 execution tracking.',
      ARRAY[]::text[],
      now()
    FROM engagements e
    LEFT JOIN clients c ON c.id = e.client_id
    WHERE e.current_phase > 5
      AND NOT EXISTS (
        SELECT 1 FROM program_audit_log pal
        WHERE pal.engagement_id = e.id
          AND pal.action = 'phase_model_v2_remap'
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Best-effort audit; never block the remap if program_audit_log
  -- has a different shape on this database.
  NULL;
END $$;

-- ── 1 · engagements.current_phase remap ───────────────────────────────
-- Drop the existing constraint up front so the UPDATE can succeed even
-- when the prior ceiling was 7. The constraint is recreated with the
-- new 0..5 ceiling at the bottom of the file.
ALTER TABLE engagements
  DROP CONSTRAINT IF EXISTS engagements_current_phase_check;

UPDATE engagements
SET
  status = COALESCE(NULLIF(status, ''), 'handed_off')
WHERE current_phase = 7;

UPDATE engagements
SET
  status = COALESCE(NULLIF(status, ''), 'complete')
WHERE current_phase = 6
  AND COALESCE(status, '') NOT IN ('handed_off');

UPDATE engagements
SET current_phase = 5
WHERE current_phase > 5;

-- ── 2 · adjacent phase_number columns clamp ───────────────────────────
-- Each table is gated by a defensive existence check so the migration
-- replays cleanly on schemas where the table or column has not yet
-- been created (or has been since renamed).

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_milestones'
      AND column_name = 'phase_number'
  ) THEN
    UPDATE program_milestones
    SET phase_number = 5
    WHERE phase_number IS NOT NULL AND phase_number > 5;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_modules'
      AND column_name = 'phase_number'
  ) THEN
    UPDATE program_modules
    SET phase_number = 5
    WHERE phase_number IS NOT NULL AND phase_number > 5;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_work_items'
      AND column_name = 'phase_number'
  ) THEN
    UPDATE program_work_items
    SET phase_number = 5
    WHERE phase_number IS NOT NULL AND phase_number > 5;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_risks'
      AND column_name = 'phase_number'
  ) THEN
    UPDATE program_risks
    SET phase_number = 5
    WHERE phase_number IS NOT NULL AND phase_number > 5;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'phase_snapshots'
      AND column_name = 'phase_number'
  ) THEN
    UPDATE phase_snapshots
    SET phase_number = 5
    WHERE phase_number IS NOT NULL AND phase_number > 5;
  END IF;
END $$;

-- program_evidence_items.phase is the same concept under a different
-- column name. Clamp it to [0..5] so evidence captured against legacy
-- P6/P7 still resolves under the new model.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_evidence_items'
      AND column_name = 'phase'
  ) THEN
    UPDATE program_evidence_items
    SET phase = 5
    WHERE phase IS NOT NULL AND phase > 5;
  END IF;
END $$;

-- ── 3 · deliverable_types.applicable_phases clamp ─────────────────────
-- applicable_phases is INT[]. Replace any element > 5 with 5 and dedupe.
-- Doing this in pure SQL keeps the migration deterministic.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'deliverable_types'
      AND column_name = 'applicable_phases'
  ) THEN
    UPDATE deliverable_types
    SET applicable_phases = (
      SELECT ARRAY(
        SELECT DISTINCT LEAST(p, 5)
        FROM unnest(applicable_phases) AS p
        ORDER BY 1
      )
    )
    WHERE applicable_phases IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM unnest(applicable_phases) AS p WHERE p > 5
      );
  END IF;
END $$;

-- ── 4 · re-add CHECK constraint at the new 0..5 ceiling ───────────────
DO $$ BEGIN
  ALTER TABLE engagements
    ADD CONSTRAINT engagements_current_phase_check
    CHECK (current_phase IS NULL OR (current_phase >= 0 AND current_phase <= 5));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table  THEN NULL;
END $$;
