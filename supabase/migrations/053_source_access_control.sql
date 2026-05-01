-- Migration 053 · Source access control + source participant grants
--
-- Mirrors the Programs access-control model for Sourcing while preserving
-- the private data-plane rule: client_admin is scoped to one active client,
-- never a cross-client super admin.

BEGIN;

ALTER TABLE person_client_memberships DROP CONSTRAINT IF EXISTS person_client_memberships_access_level_check;

UPDATE person_client_memberships
SET access_level = 'client_admin'
WHERE access_level = 'abarva_super_admin';

ALTER TABLE person_client_memberships ADD CONSTRAINT person_client_memberships_access_level_check
  CHECK (access_level IS NULL OR access_level IN (
    'client_admin',
    'program_member',
    'program_viewer',
    'source_member',
    'source_viewer'
  ));

ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_create_source_events BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_approve_source_stages BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_approve_award BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_upload_source_artifacts BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_generate_sourcing_artifacts BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_publish_sourcing_artifacts BOOLEAN NOT NULL DEFAULT false;

UPDATE person_client_memberships
SET
  access_level = CASE
    WHEN role = 'maestro' THEN 'client_admin'
    WHEN access_level IS NULL THEN 'program_viewer'
    ELSE access_level
  END,
  can_admin_users = CASE WHEN role = 'maestro' THEN true ELSE can_admin_users END,
  can_create_source_events = CASE WHEN role = 'maestro' THEN true ELSE can_create_source_events END,
  can_approve_source_stages = CASE WHEN role = 'maestro' THEN true ELSE can_approve_source_stages END,
  can_approve_award = CASE WHEN role = 'maestro' THEN true ELSE can_approve_award END,
  can_publish_sourcing_artifacts = CASE WHEN role = 'maestro' THEN true ELSE can_publish_sourcing_artifacts END
WHERE access_level IS NULL OR role = 'maestro';

CREATE TABLE IF NOT EXISTS source_event_participants (
  id                                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key                        TEXT NOT NULL,
  source_event_id                   TEXT NOT NULL,
  source_event_row_id               UUID NULL REFERENCES source_events(id) ON DELETE CASCADE,
  user_id                           TEXT NOT NULL,
  user_name                         TEXT,
  role                              TEXT,
  approval_authority                TEXT CHECK (approval_authority IS NULL OR approval_authority IN (
    'contributor',
    'reviewer',
    'approver',
    'award_approver'
  )),
  source_access_level               TEXT CHECK (source_access_level IS NULL OR source_access_level IN (
    'source_member',
    'source_viewer'
  )),
  can_view_financial                BOOLEAN NOT NULL DEFAULT false,
  can_upload_source_artifacts       BOOLEAN NOT NULL DEFAULT true,
  can_generate_sourcing_artifacts   BOOLEAN NOT NULL DEFAULT true,
  can_publish_sourcing_artifacts    BOOLEAN NOT NULL DEFAULT false,
  can_approve_source_stages         BOOLEAN NOT NULL DEFAULT false,
  can_approve_award                 BOOLEAN NOT NULL DEFAULT false,
  notify_on                         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS client_key TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS source_event_id TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS source_event_row_id UUID NULL REFERENCES source_events(id) ON DELETE CASCADE;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS approval_authority TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS source_access_level TEXT;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS can_view_financial BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS can_upload_source_artifacts BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS can_generate_sourcing_artifacts BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS can_publish_sourcing_artifacts BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS can_approve_source_stages BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS can_approve_award BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS notify_on TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE source_event_participants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_source_event_participants_user_client
  ON source_event_participants(user_id, client_key);
CREATE INDEX IF NOT EXISTS idx_source_event_participants_event
  ON source_event_participants(client_key, source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_participants_access
  ON source_event_participants(client_key, source_access_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_source_event_participants_unique_assignment
  ON source_event_participants(client_key, source_event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_person_client_memberships_source_access
  ON person_client_memberships(client_id, access_level, can_create_source_events, can_approve_source_stages);

ALTER TABLE source_event_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON source_event_participants;
CREATE POLICY "service_role_full_access" ON source_event_participants
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
