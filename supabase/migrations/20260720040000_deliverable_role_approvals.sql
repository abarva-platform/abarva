-- Named, multi-role deliverable approval — Business / Technology / Finance /
-- Risk-Security, each tracked independently rather than one global sign-off.
--
-- Today `deliverables_v2.status`/`signed_off_by`/`signed_off_at` (plus the
-- recently-added `signed_off_version`/`approved_artifact_id`) record ONE
-- overall approval action by ONE actor. That is real and stays as the
-- "the deliverable is approved" convenience flag/finalization step — this
-- migration does not touch it. What it adds is a per-role, per-deliverable
-- approval record so a deliverable type that requires (for example) both a
-- Finance approver AND a Business approver can track each independently,
-- with its own status, approver, decision date, and any outstanding
-- conditions — rather than one signature implying every stakeholder agreed.
--
-- Deliberately NOT a full audit-log table: one row per (deliverable, role),
-- upserted on each decision, holding the CURRENT status for that role. A
-- role can move draft -> pending -> reviewed -> approved, or -> rejected at
-- any point before approved. This is additive; deliverables_v2 is untouched.

BEGIN;

CREATE TABLE IF NOT EXISTS deliverable_role_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables_v2(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('business', 'technology', 'finance', 'risk_security')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')) DEFAULT 'pending',
  -- free-text, mirroring deliverables_v2.signed_off_by's convention (Clerk
  -- userId string, not FK'd to a separate users table).
  approver_user_id TEXT,
  -- display name/title for the approval record and any exported cover page
  -- (e.g. "Jane Doe, CFO") — separate from approver_user_id because the
  -- approver's display name may not be resolvable from userId alone at
  -- export time, and the record should be self-contained.
  approver_name TEXT,
  outstanding_conditions TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id, role)
);

COMMENT ON TABLE deliverable_role_approvals IS
  'Per-role approval status for a deliverable (business/technology/finance/risk_security). One row per (deliverable, role); upserted on each decision. Distinct from deliverables_v2.status, which remains the single overall sign-off/finalization flag.';

CREATE INDEX IF NOT EXISTS idx_deliverable_role_approvals_deliverable
  ON deliverable_role_approvals(deliverable_id);

ALTER TABLE deliverable_role_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_deliverable_role_approvals" ON deliverable_role_approvals;
CREATE POLICY "service_role_all_deliverable_role_approvals" ON deliverable_role_approvals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
