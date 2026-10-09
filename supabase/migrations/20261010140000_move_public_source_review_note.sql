-- Migration · Move public sources: the reviewer's note on a decision
--
-- Why: a consultant approving or rejecting an outside public source may say
-- why ("the rule applies to a different program year", "superseded by the
-- 2026 notice"). The review route accepts that note; without a column it would
-- be accepted and silently dropped. This adds one nullable column and its
-- bounds. The decision itself, the reviewer and the time are already stamped
-- by `20261010130000_move_public_research.sql`.
--
-- Rules mirrored in src/lib/deliverables/public-research/types.ts:
--   - at most 500 characters;
--   - only a decided source carries a note (a pending source has no review).
--
-- Safety: additive-only, re-runnable (ADD COLUMN IF NOT EXISTS / guarded
-- constraints). No backfill, no data change. Depends on: move_public_sources.

BEGIN;

ALTER TABLE move_public_sources
  ADD COLUMN IF NOT EXISTS review_note TEXT NULL;

DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_review_note_length_check
    CHECK (review_note IS NULL OR char_length(review_note) BETWEEN 1 AND 500);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_review_note_decided_check
    CHECK (review_note IS NULL OR decision <> 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

COMMIT;
