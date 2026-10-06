-- Who accepted a piece of evidence, recorded on the evidence row itself.
--
-- `source_event_evidence_states` could say evidence had reached a usable state
-- and could not say who decided that. The actor existed only in the activity
-- log, which is a narrative, not the record a gate can read. Its sibling
-- `source_event_gate_criterion_states` has carried `reviewer_user_id` since the
-- same original migration, so the pattern is established and was simply absent
-- here.
--
-- Deliberately additive and unconstrained. Several paths raise evidence state
-- (structured review, availability review, answer, upload sync) and only one of
-- them is updated in this change. A CHECK requiring an actor on an accepted row
-- would make every path that has not yet been updated fail at the database,
-- turning a governance improvement into an outage. The constraint belongs in
-- the change that finishes the last writer, not this one.

ALTER TABLE source_event_evidence_states
  ADD COLUMN IF NOT EXISTS accepted_by_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS accepted_by_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN source_event_evidence_states.accepted_by_user_id IS
  'The person who recorded this evidence as reviewed and usable. Null means nobody is recorded, which is different from nobody having decided: rows written before this column existed, and paths not yet updated to set it, both read null.';

COMMENT ON COLUMN source_event_evidence_states.accepted_by_name IS
  'Display name captured at the time of the decision, so a later rename does not rewrite who decided.';

COMMENT ON COLUMN source_event_evidence_states.accepted_at IS
  'When the acceptance decision was recorded. Distinct from updated_at, which moves for any write.';

-- Reading "which evidence on this event has a named acceptor" is the query a
-- readiness gate runs; without this it is a sequential scan of the event's rows.
CREATE INDEX IF NOT EXISTS source_event_evidence_states_accepted_idx
  ON source_event_evidence_states(source_event_id, requirement_id)
  WHERE accepted_by_user_id IS NOT NULL;
