-- Follow-up fix for contradiction rule timestamps.
-- The foundation migration introduced a trigger on contradiction_detection_rules
-- but that table did not yet have an updated_at column.

BEGIN;

ALTER TABLE contradiction_detection_rules
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION trigger_set_detection_rule_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contradiction_detection_rules_set_updated_at ON contradiction_detection_rules;
CREATE TRIGGER contradiction_detection_rules_set_updated_at BEFORE UPDATE ON contradiction_detection_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_detection_rule_timestamps();

UPDATE contradiction_detection_rules
SET
  updated_at = COALESCE(updated_at, last_modified_at, created_at),
  last_modified_at = COALESCE(last_modified_at, updated_at, created_at)
WHERE updated_at IS NULL OR last_modified_at IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
