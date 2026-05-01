-- Migration 052 · Program access control + restricted-output policy
--
-- Adds explicit client-level and program-level control-plane flags. The
-- application DAL enforces these even though server-side Supabase uses the
-- service role and bypasses RLS.

BEGIN;

ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS access_level TEXT
  CHECK (access_level IS NULL OR access_level IN (
    'abarva_super_admin',
    'client_admin',
    'program_member',
    'program_viewer'
  ));
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS financial_visibility BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_admin_users BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_create_programs BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE person_client_memberships ADD COLUMN IF NOT EXISTS can_approve_gates BOOLEAN NOT NULL DEFAULT false;

UPDATE person_client_memberships
SET
  access_level = CASE
    WHEN role = 'maestro' THEN 'client_admin'
    WHEN access_level IS NULL THEN 'program_viewer'
    ELSE access_level
  END,
  can_admin_users = CASE WHEN role = 'maestro' THEN true ELSE can_admin_users END,
  can_create_programs = CASE WHEN role = 'maestro' THEN true ELSE can_create_programs END,
  can_approve_gates = CASE WHEN role = 'maestro' THEN true ELSE can_approve_gates END
WHERE access_level IS NULL OR role = 'maestro';

ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS program_access_level TEXT
  CHECK (program_access_level IS NULL OR program_access_level IN (
    'program_member',
    'program_viewer'
  ));
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS can_view_financial BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS can_upload BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS can_generate_deliverables BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS can_publish_deliverables BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE engagement_participants ADD COLUMN IF NOT EXISTS can_approve_phase_gates BOOLEAN NOT NULL DEFAULT false;

UPDATE engagement_participants
SET
  program_access_level = CASE
    WHEN approval_authority IN ('sponsor', 'approver', 'contributor') THEN 'program_member'
    WHEN program_access_level IS NULL THEN 'program_viewer'
    ELSE program_access_level
  END,
  can_approve_phase_gates = CASE
    WHEN approval_authority IN ('sponsor', 'approver') THEN true
    ELSE can_approve_phase_gates
  END,
  can_publish_deliverables = CASE
    WHEN approval_authority IN ('sponsor', 'approver') THEN true
    ELSE can_publish_deliverables
  END
WHERE program_access_level IS NULL OR approval_authority IN ('sponsor', 'approver');

CREATE INDEX IF NOT EXISTS idx_engagement_participants_user_engagement
  ON engagement_participants(user_id, engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_participants_program_access
  ON engagement_participants(engagement_id, program_access_level);
CREATE INDEX IF NOT EXISTS idx_person_client_memberships_access
  ON person_client_memberships(client_id, access_level);

NOTIFY pgrst, 'reload schema';

COMMIT;
