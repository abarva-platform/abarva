-- Phase 5 · Step 3 · Admin / Setup tables — per-user read policies
--
-- Adds authenticated-role SELECT policies to all 7 Admin tables.
-- All admin tables use `client_id UUID` (FK to clients.id), so policies
-- use the can_read_tenant_by_id() helper (UUID variant).
--
-- Read gate: tenant must match JWT AND caller must be tenant_admin or maestro.
-- SME, program_initiator, and client_viewer roles do NOT read admin data.
--
-- PREREQUISITE: 20260507100000_rls_role_helpers.sql must be applied first
-- (adds clients.tenant_key and the can_read_tenant_by_id() helper).
--
-- Write policies are handled in Step 5 migration.

BEGIN;

-- ── admin_connectors ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_admin_connectors" ON admin_connectors;
CREATE POLICY "authenticated_read_admin_connectors" ON admin_connectors
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_connectors TO authenticated;


-- ── admin_datasets ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_admin_datasets" ON admin_datasets;
CREATE POLICY "authenticated_read_admin_datasets" ON admin_datasets
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_datasets TO authenticated;


-- ── admin_dataset_approvals ───────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_admin_dataset_approvals" ON admin_dataset_approvals;
CREATE POLICY "authenticated_read_admin_dataset_approvals" ON admin_dataset_approvals
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_dataset_approvals TO authenticated;


-- ── admin_dataset_quality ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_admin_dataset_quality" ON admin_dataset_quality;
CREATE POLICY "authenticated_read_admin_dataset_quality" ON admin_dataset_quality
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_dataset_quality TO authenticated;


-- ── admin_blockers ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_read_admin_blockers" ON admin_blockers;
CREATE POLICY "authenticated_read_admin_blockers" ON admin_blockers
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_blockers TO authenticated;


-- ── admin_audit_log ───────────────────────────────────────────────────────
-- Audit log access is restricted to tenant_admin and maestro.
-- Maestros can read across tenants (for support purposes).
DROP POLICY IF EXISTS "authenticated_read_admin_audit_log" ON admin_audit_log;
CREATE POLICY "authenticated_read_admin_audit_log" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_audit_log TO authenticated;


-- ── admin_setup_progress ──────────────────────────────────────────────────
-- Setup progress is readable by tenant_admin and maestro.
-- client_viewer is explicitly excluded — setup state is admin-only.
DROP POLICY IF EXISTS "authenticated_read_admin_setup_progress" ON admin_setup_progress;
CREATE POLICY "authenticated_read_admin_setup_progress" ON admin_setup_progress
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_id(client_id)
    AND is_tenant_admin()
  );

GRANT SELECT ON admin_setup_progress TO authenticated;


NOTIFY pgrst, 'reload schema';

COMMIT;
