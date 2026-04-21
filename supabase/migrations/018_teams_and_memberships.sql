-- Migration 018 · Teams + team_memberships, scope engagements to teams
-- Idempotent schema-only migration. Demo team seed/backfill moved to
-- 049_team_seed_and_backfill.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS teams_slug_key ON teams(slug);

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

ALTER TABLE team_memberships ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE team_memberships ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES persons(id) ON DELETE CASCADE;
ALTER TABLE team_memberships ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE team_memberships ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS team_memberships_team_id_person_id_key
  ON team_memberships(team_id, person_id);

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

CREATE INDEX IF NOT EXISTS idx_engagements_team_id ON engagements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_person ON team_memberships(person_id);

NOTIFY pgrst, 'reload schema';

COMMIT;
