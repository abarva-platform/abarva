-- source_event_approvals · admin approval records for sourcing events.
-- Created when an admin reviews and approves/rejects a sourcing event
-- or stage transition.

CREATE TABLE IF NOT EXISTS source_event_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  -- 'stage_advance' | 'lifecycle_change' | 'admin_review' | 'rejected'
  action                TEXT NOT NULL DEFAULT 'admin_review',
  approved_by_user_id   TEXT NOT NULL,
  from_state            TEXT,
  to_state              TEXT,
  notes                 TEXT,
  approved_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_event_approvals_event_idx ON source_event_approvals (event_id);
CREATE INDEX IF NOT EXISTS source_event_approvals_approver_idx ON source_event_approvals (approved_by_user_id);

ALTER TABLE source_event_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON source_event_approvals
  USING (true) WITH CHECK (true);
