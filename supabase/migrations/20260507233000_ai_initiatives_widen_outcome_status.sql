-- AIR-1b · Widen ai_initiative_decisions.outcome_status from
-- VARCHAR(60) to VARCHAR(160).
--
-- The realistic outcome-status strings in the AIR-2 templates exceed
-- 60 characters (e.g., "Atlas-recommended attribution study underway
-- · 6-week timeline" is 62). The original AIR-1 width was a too-tight
-- guess; widening to match the other narrative columns in the table.

BEGIN;

ALTER TABLE ai_initiative_decisions
  ALTER COLUMN outcome_status TYPE VARCHAR(160);

COMMIT;
