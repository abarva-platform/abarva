-- EXPORT-1 · program_export_log
--
-- Audit trail for the format-aware deliverable export pipeline. One row
-- per export attempt — success, denied (auth/tenant), or error. Required
-- by the design's pilot-readiness floor (DELIVERABLE_EXPORT_DESIGN.md §5):
-- "every export call writes one row to program_export_log".
--
-- This migration ships the table + RLS only. The renderer slices
-- (EXPORT-2 xlsx, EXPORT-3 docx) and the API route (EXPORT-4) write to
-- this table via the service role; users do not insert directly.
--
-- RLS posture (mirrors program_approval_workflow):
--   - INSERT  · service role only. The audit writer in
--               src/lib/programs/exports/audit.ts uses SUPABASE_SERVICE_ROLE_KEY.
--   - SELECT  · tenant admins see all rows in their tenant; non-admins
--               see only their own (actor_user_id = auth.jwt()->>'sub').
--   - UPDATE  · blocked entirely. Audit log is immutable.
--   - DELETE  · blocked entirely. Audit log is immutable.
--
-- Safety: re-runnable per CONTRIBUTING-MIGRATIONS.md. Every CREATE has
-- IF NOT EXISTS; every CREATE POLICY is preceded by a DROP POLICY IF
-- EXISTS so re-runs across preview branches are no-ops.
--
-- Depends on: engagements (002).

BEGIN;

-- ── Table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NULL REFERENCES engagements(id) ON DELETE SET NULL,
  deliverable_kind TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('html', 'xlsx', 'docx', 'pdf')),
  filename TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  actor_user_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'error')),
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defensive column adds — safe no-op if a prior migration created the
-- table with a narrower schema.
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS tenant_key TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS deliverable_kind TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS actor_user_id TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE program_export_log
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_program_export_log_tenant_program
  ON program_export_log (tenant_key, program_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_export_log_actor_created
  ON program_export_log (actor_user_id, created_at DESC);

-- ── Row-level security ─────────────────────────────────────────────────
ALTER TABLE program_export_log ENABLE ROW LEVEL SECURITY;

-- Drop any prior versions (idempotent re-runs)
DROP POLICY IF EXISTS "service_role_all_program_export_log"
  ON program_export_log;
DROP POLICY IF EXISTS "authenticated_read_own_program_export_log"
  ON program_export_log;
DROP POLICY IF EXISTS "tenant_admin_read_program_export_log"
  ON program_export_log;
DROP POLICY IF EXISTS "block_insert_authenticated_program_export_log"
  ON program_export_log;
DROP POLICY IF EXISTS "block_update_program_export_log"
  ON program_export_log;
DROP POLICY IF EXISTS "block_delete_program_export_log"
  ON program_export_log;

-- Service role: full access. The audit writer uses service role; renderers
-- and the API route also use service role. No user-facing INSERT.
CREATE POLICY "service_role_all_program_export_log"
  ON program_export_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- SELECT · non-admins see their own rows in their tenant.
CREATE POLICY "authenticated_read_own_program_export_log"
  ON program_export_log
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND actor_user_id = (auth.jwt() ->> 'sub')
  );

-- SELECT · tenant admins see all rows in their tenant. Role lookup uses
-- the `role` claim on the JWT — same convention as
-- program_approval_workflow.
CREATE POLICY "tenant_admin_read_program_export_log"
  ON program_export_log
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND (auth.jwt() ->> 'role') = 'tenant_admin'
  );

-- INSERT · explicitly blocked for the authenticated role. Audit writes
-- are server-side only via the service role. This DENY policy is
-- belt-and-suspenders alongside the absence of a permissive INSERT
-- policy (which would already deny by default), to make the intent
-- visible to reviewers.
CREATE POLICY "block_insert_authenticated_program_export_log"
  ON program_export_log
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- UPDATE · blocked entirely. Audit log is immutable.
CREATE POLICY "block_update_program_export_log"
  ON program_export_log
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

-- DELETE · blocked entirely. Audit log is immutable.
CREATE POLICY "block_delete_program_export_log"
  ON program_export_log
  FOR DELETE TO authenticated
  USING (false);

GRANT SELECT ON program_export_log TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
