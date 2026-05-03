-- Strategic Moves v0.2 schema alignment
-- 1) Extend engagements with Strategic Moves card/detail fields.
-- 2) Lift current_phase ceiling from P6 to P7 (0..7).
-- 3) Add engagement_participants.person_id and backfill from legacy fields.
--
-- NOTE:
-- - person_id remains nullable in this migration.
-- - NOT NULL hardening is intentionally deferred until unresolved rows are
--   triaged to zero in staging/prod dry-run validation.

BEGIN;

-- ── engagements column additions (v0.2 locked set) ───────────────────────
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS target_outcome TEXT,
  ADD COLUMN IF NOT EXISTS timeline_horizon TEXT,
  ADD COLUMN IF NOT EXISTS value_projected_low_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS value_projected_high_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS value_verified_usd NUMERIC,
  ADD COLUMN IF NOT EXISTS value_verified_status TEXT,
  ADD COLUMN IF NOT EXISTS value_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS value_assumptions_jsonb JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'engagements_value_verified_status_check'
      AND conrelid = 'engagements'::regclass
  ) THEN
    ALTER TABLE engagements
      ADD CONSTRAINT engagements_value_verified_status_check
      CHECK (
        value_verified_status IS NULL
        OR value_verified_status IN ('pending', 'tracked', 'final')
      );
  END IF;
END
$$;

-- ── Lift lifecycle phase ceiling to include P7 Handoff ────────────────────
ALTER TABLE engagements
  DROP CONSTRAINT IF EXISTS engagements_current_phase_check;

ALTER TABLE engagements
  ADD CONSTRAINT engagements_current_phase_check
  CHECK (current_phase IS NULL OR (current_phase >= 0 AND current_phase <= 7));

-- ── engagement_participants.person_id hardening (nullable for now) ────────
ALTER TABLE engagement_participants
  ADD COLUMN IF NOT EXISTS person_id UUID;

-- Backfill pass 1: user_id -> persons.email
-- Resolution order is locked by product direction:
--   (1) user_id == persons.email
--   (2) user_name == persons.name
WITH email_matches AS (
  SELECT
    ep.id AS participant_id,
    p.id AS person_id,
    ROW_NUMBER() OVER (
      PARTITION BY ep.id
      ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST, p.id
    ) AS rn
  FROM engagement_participants ep
  JOIN persons p
    ON lower(trim(ep.user_id)) = lower(trim(p.email))
  WHERE ep.person_id IS NULL
    AND p.email IS NOT NULL
)
UPDATE engagement_participants ep
SET person_id = em.person_id
FROM email_matches em
WHERE ep.id = em.participant_id
  AND em.rn = 1
  AND ep.person_id IS NULL;

-- Backfill pass 2: user_name -> persons.name
WITH name_matches AS (
  SELECT
    ep.id AS participant_id,
    p.id AS person_id,
    ROW_NUMBER() OVER (
      PARTITION BY ep.id
      ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST, p.id
    ) AS rn
  FROM engagement_participants ep
  JOIN persons p
    ON lower(trim(ep.user_name)) = lower(trim(p.name))
  WHERE ep.person_id IS NULL
)
UPDATE engagement_participants ep
SET person_id = nm.person_id
FROM name_matches nm
WHERE ep.id = nm.participant_id
  AND nm.rn = 1
  AND ep.person_id IS NULL;

-- Add FK (nullable posture preserved).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'engagement_participants_person_id_fkey'
      AND conrelid = 'engagement_participants'::regclass
  ) THEN
    ALTER TABLE engagement_participants
      ADD CONSTRAINT engagement_participants_person_id_fkey
      FOREIGN KEY (person_id)
      REFERENCES persons(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE engagement_participants
  VALIDATE CONSTRAINT engagement_participants_person_id_fkey;

CREATE INDEX IF NOT EXISTS idx_engagement_participants_person_id
  ON engagement_participants(person_id);

COMMIT;
