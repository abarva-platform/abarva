-- Migration · backfill engagements.graph_node_id for any rows inserted
-- without one. The programs-demo-apex seed + earlier seed paths omitted
-- this column, leaving rows whose /engagements/[graphId] deep links
-- resolve to /engagements/null which 404s for Sonnet's test agent and
-- any first-time human viewer.
--
-- Idempotent: only touches rows where graph_node_id IS NULL; embeds the
-- row's id suffix to guarantee uniqueness across duplicate names.

BEGIN;

UPDATE engagements
SET graph_node_id =
  'eng_' || regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g') || '_' || substring(id::text FROM 1 FOR 8)
WHERE graph_node_id IS NULL
  AND name IS NOT NULL;

-- Edge case · if name is also null, fall back to the row's id for a
-- still-navigable slug. Keeps the UNIQUE index happy.
UPDATE engagements
SET graph_node_id = 'eng_' || replace(id::text, '-', '')
WHERE graph_node_id IS NULL;

-- Strip any stray leading / trailing underscores produced by the slug
-- regex above (names starting with a digit or symbol).
UPDATE engagements
SET graph_node_id = trim(both '_' FROM graph_node_id)
WHERE graph_node_id LIKE '\_%' OR graph_node_id LIKE '%\_';

COMMIT;

NOTIFY pgrst, 'reload schema';
