-- source_event_approvals · add stage_key
--
-- The append-only Source approval trail (event_id, action, approved_by_user_id,
-- from_state, to_state, notes, created_at) never recorded WHICH of the 11 canonical
-- stages an approval was for -- only the lifecycle-state transition
-- (waiting_on_client -> active, etc). That made "who approved the Strategy gate,
-- and when" unrecoverable from stored data: the app always knew the current stage
-- at approval time, it just never wrote it down.
--
-- This adds a nullable stage_key column, populated by the write path going
-- forward (see src/app/api/v1/source/events/[eventId]/approve/route.ts and
-- src/lib/data-plane/write-adapters/sourceWriteAdapter.ts). Existing historical
-- rows are left NULL -- deliberately not backfilled by inference (ordering +
-- notes-text heuristics would misattribute rows across send-backs/rejections,
-- which this same API supports). A NULL stage_key on an old row means "stage not
-- recorded for this approval," shown honestly as such in the UI, not guessed.
--
-- Discovered from: SOURCE-SHELL-003 (single-event Approvals ledger view), which
-- needs a real per-gate approver/timestamp and found this gap while scoping it.

ALTER TABLE source_event_approvals
  ADD COLUMN IF NOT EXISTS stage_key TEXT;

COMMENT ON COLUMN source_event_approvals.stage_key IS
  'Canonical Source stage key (src/lib/source/constants.ts) the approval action was for. NULL on rows written before this column existed -- not backfilled by inference; shown as "not recorded" rather than guessed.';

-- Lookup path: one event's approval history, in stage order.
CREATE INDEX IF NOT EXISTS source_event_approvals_event_stage_idx
  ON source_event_approvals (event_id, stage_key);
