-- Migration 017 · Drop deprecated tables from earlier schema attempts
-- Run AFTER confirming no in-flight data worth preserving.
--
-- Pre-flight check (run these first in a separate query):
--   SELECT COUNT(*) FROM intake_turns;
--   SELECT COUNT(*) FROM engagement_charters;
--
-- If non-zero and the data matters, export first. For v1 these are stale
-- conversation state from early prototypes and safe to drop.

BEGIN;

DROP TABLE IF EXISTS intake_turns CASCADE;
DROP TABLE IF EXISTS engagement_charters CASCADE;

-- client_brief deliberately NOT dropped here. Inspect first:
--   SELECT client_name, COUNT(*) FROM client_brief GROUP BY client_name;
-- If it contains real Meridian/Arcturus/Apex data not captured in
-- persons + engagements + Pinecone, hold off. Otherwise uncomment:
-- DROP TABLE IF EXISTS client_brief CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
