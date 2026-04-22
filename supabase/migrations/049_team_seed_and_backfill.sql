-- Migration 049 · Demo team seed and engagement team backfill
-- Extracted from 018 so schema DDL and demo DML run independently.

BEGIN;

INSERT INTO teams (name, slug)
VALUES ('AbarVa HQ', 'abarva-hq')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO team_memberships (team_id, person_id, role)
SELECT
  t.id,
  p.id,
  'admin'
FROM teams t
JOIN persons p ON p.graph_node_id = 'person_anand_sundaram'
WHERE t.slug = 'abarva-hq'
ON CONFLICT (team_id, person_id) DO NOTHING;

UPDATE engagements
SET team_id = t.id
FROM teams t
WHERE t.slug = 'abarva-hq'
  AND engagements.team_id IS NULL;

COMMIT;
