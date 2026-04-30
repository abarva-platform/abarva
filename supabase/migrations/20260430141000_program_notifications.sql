-- Migration: program_notifications
-- Notification history and email log for program lifecycle events.
-- Email send layer uses Resend (OV2-2d-NOTIFY, PR #1274).

CREATE TABLE IF NOT EXISTS program_notifications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key        TEXT        NOT NULL,
  program_id        TEXT        NOT NULL,  -- display ID e.g. APX-CDP-2026
  engagement_id     UUID        REFERENCES engagements(id) ON DELETE CASCADE,
  recipient_id      UUID        REFERENCES persons(id) ON DELETE CASCADE,
  recipient_email   TEXT        NOT NULL,
  notification_type TEXT        NOT NULL
    CHECK (notification_type IN (
      'approval_requested',
      'approval_decided',
      'gate_advanced',
      'gate_blocked',
      'milestone_reached',
      'comment_added',
      'assignment_changed'
    )),
  subject           TEXT        NOT NULL,
  body_text         TEXT        NOT NULL,
  body_html         TEXT,
  sent_at           TIMESTAMPTZ,
  send_error        TEXT,
  metadata_jsonb    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_program_notifications_tenant_program
  ON program_notifications (tenant_key, program_id, created_at DESC);

CREATE INDEX idx_program_notifications_recipient_sent
  ON program_notifications (recipient_id, sent_at DESC NULLS LAST);

-- Row-Level Security
ALTER TABLE program_notifications ENABLE ROW LEVEL SECURITY;

-- Service role: full access (sending, retry, admin reporting)
CREATE POLICY "service_role_all_notifications"
  ON program_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: SELECT only their own notifications
CREATE POLICY "authenticated_select_own_notifications"
  ON program_notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());
