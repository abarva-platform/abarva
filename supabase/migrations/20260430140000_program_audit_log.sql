-- Migration: program_audit_log
-- Write-only audit trail for program state transitions and actor actions.
-- No UPDATE or DELETE is permitted by any role (enforced via RLS + trigger).

CREATE TABLE IF NOT EXISTS program_audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key      TEXT        NOT NULL,
  program_id      TEXT        NOT NULL,  -- display ID e.g. APX-CDP-2026
  engagement_id   UUID        REFERENCES engagements(id) ON DELETE SET NULL,
  actor_id        UUID        REFERENCES persons(id) ON DELETE SET NULL,
  actor_role      TEXT,
  action          TEXT        NOT NULL,
  from_state      TEXT,
  to_state        TEXT,
  rationale       TEXT,
  evidence_refs   TEXT[]      NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_program_audit_log_tenant_program
  ON program_audit_log (tenant_key, program_id, created_at DESC);

CREATE INDEX idx_program_audit_log_engagement
  ON program_audit_log (engagement_id, created_at DESC);

-- Row-Level Security
ALTER TABLE program_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role: full read access (needed for admin views + reporting)
CREATE POLICY "service_role_select_audit_log"
  ON program_audit_log
  FOR SELECT
  TO service_role
  USING (true);

-- Authenticated users: INSERT only when tenant_key matches session claim
CREATE POLICY "authenticated_insert_audit_log"
  ON program_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_key = current_setting('app.current_tenant_key', true)
  );

-- Authenticated users: SELECT own tenant's rows
CREATE POLICY "authenticated_select_audit_log"
  ON program_audit_log
  FOR SELECT
  TO authenticated
  USING (
    tenant_key = current_setting('app.current_tenant_key', true)
  );

-- No UPDATE policy for any role → UPDATE is blocked at DB level
-- No DELETE policy for any role → DELETE is blocked at DB level

-- Trigger: belt-and-suspenders guard against UPDATE or DELETE
-- (complements the absence of RLS policies for those operations)
CREATE OR REPLACE FUNCTION program_audit_log_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'program_audit_log is write-only: UPDATE and DELETE are not permitted';
END;
$$;

CREATE TRIGGER program_audit_log_no_update
  BEFORE UPDATE ON program_audit_log
  FOR EACH ROW EXECUTE FUNCTION program_audit_log_immutable();

CREATE TRIGGER program_audit_log_no_delete
  BEFORE DELETE ON program_audit_log
  FOR EACH ROW EXECUTE FUNCTION program_audit_log_immutable();
