-- Manage Moves · bulk archive/restore state for Strategic Moves
--
-- "Archive" is a reversible soft state — NEVER a hard delete. Archiving a Move
-- preserves all evidence, artifacts, approvals, deliverables, traces, and audit
-- history. The Move is simply hidden from active portfolio views and excluded
-- from active recommendations. Restore returns it to its prior lifecycle_state.
--
-- This migration:
--
--   1. Extends the `engagements_lifecycle_state_check` CHECK constraint (added
--      in 20260430120100_program_approval_workflow.sql) to allow 'archived' as
--      a valid lifecycle_state. The constraint is DROPped and re-ADDed with the
--      full value set, preserving the `NULL OR IN (...)` shape.
--
--   2. Adds archive-provenance columns on engagements:
--        - archived_by             TEXT  (actor who archived; archived_at exists
--                                          already from migration 041)
--        - archive_reason          TEXT  (structured reason code)
--        - archive_explanation     TEXT  (free-text rationale)
--        - archived_from_state     TEXT  (the lifecycle_state to restore to)
--
-- All statements are idempotent — re-applying locally is safe. Wrapped in a
-- single transaction so a partial apply never leaves the constraint dropped.
--
-- NOTE: do NOT apply locally — this is applied in-VNet against the private
-- Postgres data plane via the operator migrate job.

BEGIN;

-- ── 1 · Extend lifecycle_state CHECK to allow 'archived' ───────────────────
-- DROP the existing constraint (if present) and re-ADD it with the full value
-- set including 'archived'. Guarded so a re-run is a no-op.
DO $$ BEGIN
  ALTER TABLE engagements
    DROP CONSTRAINT IF EXISTS engagements_lifecycle_state_check;

  ALTER TABLE engagements
    ADD CONSTRAINT engagements_lifecycle_state_check
    CHECK (
      lifecycle_state IS NULL
      OR lifecycle_state IN (
        'draft',
        'submitted_for_approval',
        'approved',
        'rejected',
        'paused',
        'canceled',
        'completed',
        'archived'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- ── 2 · Archive-provenance columns ────────────────────────────────────────
-- archived_at already exists (migration 041). Add the rest, all nullable, all
-- IF NOT EXISTS so this is idempotent.
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS archived_by TEXT;
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS archive_explanation TEXT;
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS archived_from_state TEXT;

COMMIT;
