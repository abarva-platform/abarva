-- Tower live-source ingest: Jira issues.
--
-- Backs S7 — `src/lib/tower/ingest/jira/parse.ts` + CLI
-- `src/scripts/tower/ingest-jira.ts`. One row per Jira issue. The CLI is
-- idempotent on `(client_id, issue_key)` so re-running an extract overwrites
-- prior state for that key.
--
-- Tenant-scoped via `client_id`. RLS allows service_role full access and
-- (in pilot) lets authenticated users read their own tenant's rows.

BEGIN;

DO $$ BEGIN
  CREATE TYPE tower_jira_issue_type AS ENUM ('Epic', 'Story', 'Bug', 'Task');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tower_jira_issue_status AS ENUM (
    'Backlog',
    'To Do',
    'In Progress',
    'In Review',
    'Blocked',
    'Done',
    'Cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tower_jira_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  issue_type tower_jira_issue_type NOT NULL,
  epic_key TEXT,
  team TEXT NOT NULL,
  status tower_jira_issue_status NOT NULL,
  story_points INTEGER CHECK (story_points IS NULL OR story_points >= 0),
  created_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cycle_time_hours NUMERIC(10, 2) CHECK (cycle_time_hours IS NULL OR cycle_time_hours >= 0),
  source_file TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_jira_issues_client_key_unique UNIQUE (client_id, issue_key)
);

CREATE INDEX IF NOT EXISTS idx_tower_jira_issues_client_team
  ON tower_jira_issues (client_id, team);

CREATE INDEX IF NOT EXISTS idx_tower_jira_issues_client_status
  ON tower_jira_issues (client_id, status);

CREATE INDEX IF NOT EXISTS idx_tower_jira_issues_client_epic
  ON tower_jira_issues (client_id, epic_key)
  WHERE epic_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tower_jira_issues_client_created
  ON tower_jira_issues (client_id, created_at DESC);

ALTER TABLE tower_jira_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tower_jira_issues" ON tower_jira_issues;
CREATE POLICY "service_role_all_tower_jira_issues" ON tower_jira_issues
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_own_tenant_tower_jira_issues" ON tower_jira_issues;
CREATE POLICY "authenticated_read_own_tenant_tower_jira_issues" ON tower_jira_issues
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE tower_jira_issues IS
  'Jira issues ingested via /tower/onboard or CLI src/scripts/tower/ingest-jira.ts. Idempotent on (client_id, issue_key).';

COMMIT;

NOTIFY pgrst, 'reload schema';
