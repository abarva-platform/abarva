-- OV2-2a · Tenant-admin approval workflow data layer
--
-- Adds the explicit P0 stage gate (Gate 0b) between
-- `submitted_for_approval` and `approved` in the program lifecycle. See
-- docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md §B.2 (state
-- machine), §D.0.5 (P0 stage gate) and Part G (slice OV2-2).
--
-- Today, programs flip directly from draft → active inside the
-- `commit_program` agent tool. This migration introduces:
--
--   1. `engagements.lifecycle_state` — a new column that supersedes the
--      legacy `engagements.status` field for the new state machine.
--      `status` is left untouched (back-compat) but new code paths read
--      `lifecycle_state`. Default for existing rows backfills to
--      'approved' so previously-active programs continue to work.
--
--   2. `program_approval_requests` — one row per submission, captures
--      the brief at submission time so the audit trail survives later
--      edits to the engagement.
--
--   3. RLS policies that mirror the codebase convention:
--      service-role-everywhere + per-user authenticated read scoped by
--      tenant_key. UPDATE is gated to tenant-admin role; DELETE is
--      blocked entirely (approvals are immutable).
--
--   4. Triggers · `updated_at` auto-touch + a data-integrity trigger
--      that flips `engagements.lifecycle_state` to match when an
--      approval request transitions to approved/rejected.
--
-- All statements are idempotent — re-applying locally is safe.

BEGIN;

-- ── 1 · engagements.lifecycle_state column ─────────────────────────────
-- The legacy `status` column on engagements uses values
-- (draft|active|paused|completed|cancelled). The new state machine adds
-- 'submitted_for_approval', 'approved', 'rejected' as explicit gates,
-- plus 'canceled' (US spelling matches design doc §B.2).
--
-- Rather than mutate `status` in place (which several legacy code paths
-- read), introduce `lifecycle_state` and have new code prefer it.

ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT;

DO $$ BEGIN
  ALTER TABLE engagements
    ADD CONSTRAINT engagements_lifecycle_state_check
    CHECK (
      lifecycle_state IS NULL
      OR lifecycle_state IN (
        'draft',
        'submitted_for_approval',
        'approved',
        'rejected',
        'paused',
        'canceled',
        'completed'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- Backfill: anything that already exists prior to this migration is
-- presumed to have been live before the new gate was introduced, so we
-- mark them 'approved' to preserve current behavior.
UPDATE engagements
   SET lifecycle_state = 'approved'
 WHERE lifecycle_state IS NULL;

CREATE INDEX IF NOT EXISTS idx_engagements_lifecycle_state
  ON engagements (lifecycle_state);

-- ── 2 · program_approval_requests table ────────────────────────────────

CREATE TABLE IF NOT EXISTS program_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (request_status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  decided_by_user_id TEXT NULL,
  decided_at TIMESTAMPTZ NULL,
  decision_rationale TEXT NULL,
  -- Snapshot of the brief at submission time. Audit-quality history is
  -- the goal — even if the engagement is later edited, the queue still
  -- shows what the admin actually approved.
  brief_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_approval_requests_tenant_status_time
  ON program_approval_requests (tenant_key, request_status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_approval_requests_program
  ON program_approval_requests (program_id);

-- ── 3 · updated_at trigger ─────────────────────────────────────────────
-- Defined inline so this migration is self-contained even if the shared
-- trigger_set_updated_at function from migration 013 has been dropped.

CREATE OR REPLACE FUNCTION touch_program_approval_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_program_approval_requests_updated_at
  ON program_approval_requests;
CREATE TRIGGER update_program_approval_requests_updated_at
  BEFORE UPDATE ON program_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION touch_program_approval_requests_updated_at();

-- ── 4 · data-integrity trigger · sync engagements.lifecycle_state ──────
-- When a request transitions from 'pending' to 'approved' / 'rejected',
-- flip the corresponding engagement's lifecycle_state to match. The
-- trigger is intentionally narrow: only the two terminal decision
-- transitions cascade. 'withdrawn' is left to application logic — a
-- withdrawal usually returns the engagement to 'draft', not 'rejected'.

CREATE OR REPLACE FUNCTION sync_engagement_lifecycle_on_approval_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_status = 'approved'
     AND (OLD.request_status IS DISTINCT FROM 'approved') THEN
    UPDATE engagements
       SET lifecycle_state = 'approved'
     WHERE id = NEW.program_id;
  ELSIF NEW.request_status = 'rejected'
     AND (OLD.request_status IS DISTINCT FROM 'rejected') THEN
    UPDATE engagements
       SET lifecycle_state = 'rejected'
     WHERE id = NEW.program_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_engagement_lifecycle_on_decision
  ON program_approval_requests;
CREATE TRIGGER sync_engagement_lifecycle_on_decision
  AFTER UPDATE OF request_status ON program_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_engagement_lifecycle_on_approval_decision();

-- ── 5 · RLS · service-role write, scoped read, admin update, no delete ──

ALTER TABLE program_approval_requests ENABLE ROW LEVEL SECURITY;

-- Drop any prior versions (idempotent re-runs)
DROP POLICY IF EXISTS "service_role_all_program_approval_requests"
  ON program_approval_requests;
DROP POLICY IF EXISTS "authenticated_read_program_approval_requests"
  ON program_approval_requests;
DROP POLICY IF EXISTS "authenticated_insert_program_approval_requests"
  ON program_approval_requests;
DROP POLICY IF EXISTS "tenant_admin_update_program_approval_requests"
  ON program_approval_requests;
DROP POLICY IF EXISTS "block_delete_program_approval_requests"
  ON program_approval_requests;

-- Service role gets everything (server-side API routes use this)
CREATE POLICY "service_role_all_program_approval_requests"
  ON program_approval_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users see rows in their own tenant. Both program
-- initiators (own submissions) and tenant admins (queue view) read via
-- this same policy; row narrowing for non-admins is enforced at the
-- API/UI layer when needed.
CREATE POLICY "authenticated_read_program_approval_requests"
  ON program_approval_requests
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
  );

-- Only the requesting user can insert; tenant must match their JWT.
CREATE POLICY "authenticated_insert_program_approval_requests"
  ON program_approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND requested_by_user_id = (auth.jwt() ->> 'sub')
  );

-- Updates are restricted to tenant admins. Role lookup uses the
-- `role` claim on the JWT — matches what `auth.jwt() ->> 'role'`
-- returns when a Clerk session for an admin is presented to Supabase.
-- The application layer is the primary check (see
-- src/lib/programs/approval.ts); RLS is the second line of defense.
CREATE POLICY "tenant_admin_update_program_approval_requests"
  ON program_approval_requests
  FOR UPDATE TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND (auth.jwt() ->> 'role') = 'tenant_admin'
  )
  WITH CHECK (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND (auth.jwt() ->> 'role') = 'tenant_admin'
  );

-- DELETE is blocked entirely. Approvals are immutable for audit;
-- rejected/withdrawn requests stay in the table.
CREATE POLICY "block_delete_program_approval_requests"
  ON program_approval_requests
  FOR DELETE TO authenticated
  USING (false);

GRANT SELECT, INSERT, UPDATE ON program_approval_requests TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
