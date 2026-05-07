-- Migration 053 · Client-pinned access model
--
-- Private data planes do not support a cross-client super-admin role. The
-- highest application data role is client_admin, and it is always scoped by
-- person_client_memberships.client_id plus the active tenant context.

BEGIN;

UPDATE person_client_memberships
SET access_level = 'client_admin'
WHERE access_level = 'abarva_super_admin';

DO $$
BEGIN
  -- Skip the narrower constraint if 20260501170000_source_access_control already
  -- applied the broader person_client_memberships_access_level_check (which adds
  -- source_member / source_viewer). Adding the narrower constraint after that
  -- migration has seeded source roles would fail the check.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'person_client_memberships_client_pinned_access_level'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'person_client_memberships_access_level_check'
  ) THEN
    ALTER TABLE person_client_memberships
      ADD CONSTRAINT person_client_memberships_client_pinned_access_level
      CHECK (
        access_level IS NULL
        OR access_level IN ('client_admin', 'program_member', 'program_viewer')
      );
  END IF;
END $$;

COMMENT ON COLUMN person_client_memberships.access_level IS
  'Highest private-data-plane role is client_admin scoped to one client_id; no cross-client data admin role is permitted.';

NOTIFY pgrst, 'reload schema';

COMMIT;
