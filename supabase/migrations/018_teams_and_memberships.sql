-- Migration 018 · Teams + team_memberships, scope engagements to teams
-- Idempotent. Seeds AbarVa HQ + admin membership for Anand, backfills all
-- existing engagements to the default team.

BEGIN;

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS teams_set_updated_at ON teams;
CREATE TRIGGER teams_set_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'maestro', 'observer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, person_id)
);

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

INSERT INTO teams (name, slug) VALUES ('AbarVa HQ', 'abarva-hq')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO team_memberships (team_id, person_id, role)
SELECT
  (SELECT id FROM teams WHERE slug = 'abarva-hq'),
  (SELECT id FROM persons WHERE graph_node_id = 'person_anand_sundaram'),
  'admin'
WHERE EXISTS (SELECT 1 FROM persons WHERE graph_node_id = 'person_anand_sundaram')
ON CONFLICT (team_id, person_id) DO NOTHING;

UPDATE engagements SET team_id = (SELECT id FROM teams WHERE slug = 'abarva-hq')
WHERE team_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_engagements_team_id ON engagements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_person ON team_memberships(person_id);

NOTIFY pgrst, 'reload schema';

COMMIT;
