-- PRE-W4-PR-4 · Approval escalation + notify-sponsor
--
-- Extends `program_approval_requests` (introduced in
-- 20260430120100_program_approval_workflow.sql) with bookkeeping for
-- admin-initiated escalation. Two new admin actions write into these
-- columns: "notify sponsor" (escalation_level=1) and
-- "escalate to platform admin" (escalation_level=2). They are the
-- in-surface remediation paths a tenant admin needs when an approval
-- has been sitting unread for hours.
--
-- These columns also feed the `approval.escalated` notification event
-- introduced in Trust Plane Wave 4. The audit row (admin_audit_log)
-- written by the server action is the canonical event source — these
-- columns are the runtime state the UI reads.
--
-- Auto-escalation (cron-driven SLA expiry) is intentionally NOT in
-- scope here; that arrives in Wave 7. PR-4 ships the admin-initiated
-- paths only.
--
-- Schema additions:
--   • escalation_level      INT      DEFAULT 0  CHECK IN (0,1,2)
--       0 = original submission (no admin escalation yet)
--       1 = sponsor reminded (notify-sponsor action fired)
--       2 = platform-admin re-routed (escalate action fired)
--   • last_notified_at      TIMESTAMPTZ NULL  — wall-clock of last reminder
--   • notify_count          INT         DEFAULT 0 — # of sponsor reminders
--   • escalated_to_user_id  TEXT        NULL — Clerk user id of platform admin
--
-- RLS posture is unchanged; this migration only adds columns and a
-- CHECK constraint. The existing service_role + tenant-scoped
-- authenticated policies still gate every row.

BEGIN;

ALTER TABLE program_approval_requests
  ADD COLUMN IF NOT EXISTS escalation_level INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS notify_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_to_user_id TEXT NULL;

-- Defensive: drop & recreate the CHECK so re-runs converge on the
-- canonical constraint definition even if a prior partial run set
-- something looser.
ALTER TABLE program_approval_requests
  DROP CONSTRAINT IF EXISTS program_approval_requests_escalation_level_chk;
ALTER TABLE program_approval_requests
  ADD CONSTRAINT program_approval_requests_escalation_level_chk
  CHECK (escalation_level IN (0, 1, 2));

-- Helpful index for SLA-driven sorting (longest-pending first).
CREATE INDEX IF NOT EXISTS idx_program_approval_requests_tenant_pending_age
  ON program_approval_requests (tenant_key, requested_at ASC)
  WHERE request_status = 'pending';

NOTIFY pgrst, 'reload schema';

COMMIT;
