-- Existing Source events retain signed-scope authority. Only newly created
-- events may explicitly opt into Event Owner SELF authority at creation time.
ALTER TABLE source_events
  ADD COLUMN approval_policy_code TEXT NOT NULL DEFAULT 'legacy_signed_scope_v1';

ALTER TABLE source_events
  ADD CONSTRAINT source_events_approval_policy_code_check
  CHECK (approval_policy_code IN ('legacy_signed_scope_v1', 'self_v1'));

CREATE OR REPLACE FUNCTION source_events_reject_approval_policy_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.approval_policy_code IS DISTINCT FROM NEW.approval_policy_code THEN
    RAISE EXCEPTION 'Source event approval policy cannot change after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER source_events_approval_policy_immutable
  BEFORE UPDATE ON source_events
  FOR EACH ROW EXECUTE FUNCTION source_events_reject_approval_policy_change();
