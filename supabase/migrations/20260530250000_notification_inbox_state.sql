-- W5-PR-1 · Enterprise Comms Spine · in-app inbox read state
--
-- Adds durable read/archive state to notification_deliveries so the
-- admin inbox and top-nav unread badge can agree on the same source of
-- truth. The event log remains append-only; this migration only extends
-- the per-user delivery ledger.

BEGIN;

ALTER TABLE notification_deliveries
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_inbox_unread
  ON notification_deliveries (tenant_id, user_id, created_at DESC)
  WHERE channel = 'in_app' AND archived_at IS NULL AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_inbox_all
  ON notification_deliveries (tenant_id, user_id, channel, created_at DESC)
  WHERE archived_at IS NULL;

COMMENT ON COLUMN notification_deliveries.read_at IS
  'When the recipient marked this in-app notification as read. Null means unread.';

COMMENT ON COLUMN notification_deliveries.archived_at IS
  'When the recipient removed this in-app notification from their active inbox. Null means active.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Down migration (manual):
-- BEGIN;
--   DROP INDEX IF EXISTS idx_notification_deliveries_inbox_unread;
--   DROP INDEX IF EXISTS idx_notification_deliveries_inbox_all;
--   ALTER TABLE notification_deliveries
--     DROP COLUMN IF EXISTS read_at,
--     DROP COLUMN IF EXISTS archived_at;
-- COMMIT;
