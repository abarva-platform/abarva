-- Phase 5 · Step 1 · RLS role helper functions
--
-- Establishes the canonical JWT-to-role helper layer that all subsequent
-- per-user RLS policy migrations (Steps 2-6) depend on.
--
-- Design decisions documented here:
--
-- 1. ALL functions are STABLE SECURITY DEFINER so RLS policies can call them
--    without triggering recursive RLS evaluation on referenced tables.
--
-- 2. The `clients` table is extended with a `tenant_key` column (canonical
--    slug, e.g. 'apexretail', 'meridian'). Source tables already use
--    `client_key TEXT`; admin/tower tables use `client_id UUID`. The helpers
--    can_read_tenant_by_key() and can_read_tenant_by_id() unify both via this
--    column, keeping RLS policies simple.
--
-- 3. Role hierarchy is intentionally wide in the helpers rather than strict:
--    'admin' and 'maestro' are both platform-admin roles (Clerk publicMetadata).
--    'tenant_admin' and 'client_admin' map to the same capability tier.
--    The helpers accept all valid spellings so migrations do not need to track
--    Clerk publicMetadata evolution.
--
-- 4. Helpers default to the least-privileged posture on missing claims:
--    current_user_role() defaults to 'observer'; current_tenant_key() returns
--    NULL (which causes tenant equality checks to fail silently, blocking
--    cross-tenant reads).
--
-- Prerequisite: Clerk JWT template 'supabase' must emit:
--   { "tenant_key": "{{user.public_metadata.clientId}}",
--     "role":       "{{user.public_metadata.role}}",
--     "sub":        "{{user.id}}" }
-- Without this, `auth.jwt() ->> 'tenant_key'` returns NULL for all requests
-- and all authenticated-role policies will deny reads. The service_role
-- bypass (auth.role() = 'service_role') is always present and is not
-- affected by JWT shape.

BEGIN;

-- ── Extend clients with canonical tenant_key ──────────────────────────────
-- Add the canonical short key that matches the JWT tenant_key claim.
-- Existing source tables store this as `client_key TEXT`; admin/tower
-- tables store `client_id UUID`. This column bridges both worlds.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_key TEXT;

-- Populate from known canonical mappings (idempotent UPDATE).
-- Only updates rows where tenant_key is NULL to avoid clobbering manual
-- overrides applied in later migrations.
UPDATE clients SET tenant_key = 'apexretail'
  WHERE tenant_key IS NULL
    AND (name ILIKE 'Apex Retail%');

UPDATE clients SET tenant_key = 'meridian'
  WHERE tenant_key IS NULL
    AND (name ILIKE 'Meridian Health%');

UPDATE clients SET tenant_key = 'arcturus'
  WHERE tenant_key IS NULL
    AND (name ILIKE '%Arcturus%' OR name ILIKE '%First Capital%');

UPDATE clients SET tenant_key = 'keystone'
  WHERE tenant_key IS NULL
    AND (name ILIKE 'Keystone%');

-- Unique index ensures the UUID→key lookup in helpers is an index scan.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_tenant_key
  ON clients (tenant_key)
  WHERE tenant_key IS NOT NULL;

-- ── JWT claim extractors ───────────────────────────────────────────────────

-- current_tenant_key: the tenant this request is scoped to.
-- Returns NULL if the claim is absent; downstream equality checks treat
-- NULL as no-match (blocking cross-tenant reads).
CREATE OR REPLACE FUNCTION current_tenant_key()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'tenant_key'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- current_user_role: the Clerk publicMetadata.role of the signed-in user.
-- Defaults to 'observer' (least-privileged) when the claim is absent.
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', 'observer')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- current_user_id: the Clerk userId (sub claim).
-- Used for ownership checks (e.g., created_by_user_id = current_user_id()).
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'sub'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Role predicate helpers ────────────────────────────────────────────────
-- These accept all role spellings Clerk may emit to insulate policies
-- from publicMetadata naming drift.

-- is_maestro: true for platform-level administrators (full cross-tenant read).
CREATE OR REPLACE FUNCTION is_maestro()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('maestro', 'admin', 'investor')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- is_tenant_admin: true for roles that can write and approve within one tenant.
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('maestro', 'admin', 'tenant_admin', 'client_admin')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- is_program_initiator: true for roles that can read and write program/source
-- data they own, but cannot approve or cross tenant boundaries.
CREATE OR REPLACE FUNCTION is_program_initiator()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN (
    'maestro', 'admin',
    'tenant_admin', 'client_admin',
    'program_initiator', 'program_member',
    'source_member'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Tenant access helpers (text key variant) ─────────────────────────────
-- Use for tables that store tenant identity as TEXT (Source tables:
-- source_events.client_key, source_artifacts.tenant_key, etc.)

-- can_read_tenant_by_key: read is permitted when the row's key matches the
-- JWT claim OR the caller is maestro (cross-tenant read privilege).
CREATE OR REPLACE FUNCTION can_read_tenant_by_key(p_tenant_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT p_tenant_key = current_tenant_key()
      OR is_maestro()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- can_write_tenant_by_key: write permitted only when tenant matches AND
-- caller has admin-level role. Program initiators write through the API
-- with service-role; direct authenticated-role writes require admin.
CREATE OR REPLACE FUNCTION can_write_tenant_by_key(p_tenant_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT p_tenant_key = current_tenant_key()
      AND is_tenant_admin()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Tenant access helpers (UUID variant) ──────────────────────────────────
-- Use for tables that store tenant identity as UUID FK to clients.id
-- (admin_*, atlas_threads, atlas_observations, kpis, pattern_packs, etc.)

-- can_read_tenant_by_id: looks up the canonical tenant_key from the clients
-- table (added above) and compares to the JWT claim.
CREATE OR REPLACE FUNCTION can_read_tenant_by_id(p_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE id = p_client_id
      AND tenant_key = current_tenant_key()
  ) OR is_maestro()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- can_write_tenant_by_id: UUID variant of the write helper.
CREATE OR REPLACE FUNCTION can_write_tenant_by_id(p_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE id = p_client_id
      AND tenant_key = current_tenant_key()
  ) AND is_tenant_admin()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Grant helpers to authenticated role ───────────────────────────────────
-- RLS policies on authenticated connections can call these without
-- elevation because SECURITY DEFINER handles the privilege.
GRANT EXECUTE ON FUNCTION current_tenant_key() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_maestro() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_program_initiator() TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_tenant_by_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_write_tenant_by_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_tenant_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_write_tenant_by_id(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
