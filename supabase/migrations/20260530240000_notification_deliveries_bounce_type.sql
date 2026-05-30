-- W4-PR-7 · Enterprise Comms Spine · notification_deliveries.bounce_type
--
-- Adds a single nullable column to the W4-PR-1 notification_deliveries
-- table so the Resend webhook handler can record the Resend-reported
-- bounce class (Permanent / Transient / Undetermined) alongside the
-- existing free-text bounce_reason.
--
-- Why this matters: persistent-bounce auto-disable (Spine §9 failure mode
-- C) needs to distinguish a one-off transient bounce (greylisted MTA,
-- soft mailbox-full) from a hard permanent bounce (unknown recipient,
-- domain not found). Permanent bounces flip the user's email channel
-- to 'none' immediately; transient bounces only trigger disable after a
-- 7-day threshold (default 3 in this PR).
--
-- The trigger from 20260530220000_notifications.sql does NOT enforce
-- bounce_type immutability — the worker may legitimately update it as
-- additional acks land (e.g. Transient → Permanent on retry exhaustion).
--
-- Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §9 + §11 W4-PR-7

BEGIN;

ALTER TABLE notification_deliveries
  ADD COLUMN IF NOT EXISTS bounce_type TEXT
    CHECK (bounce_type IS NULL OR bounce_type IN ('Permanent', 'Transient', 'Undetermined'));

COMMENT ON COLUMN notification_deliveries.bounce_type IS
  'Resend-reported bounce class. Permanent → immediate channel disable. Transient/Undetermined → counted toward 7-day threshold.';

-- Index supports the persistent-bounce-history lookup in the webhook
-- broker: count bounced deliveries for (tenant_id, user_id, channel,
-- created_at >= now() - 7d).
CREATE INDEX IF NOT EXISTS idx_deliveries_bounce_history
  ON notification_deliveries (tenant_id, user_id, channel, created_at DESC)
  WHERE status = 'bounced';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- Down migration (commented; apply manually to roll back).
--
-- BEGIN;
--   DROP INDEX IF EXISTS idx_deliveries_bounce_history;
--   ALTER TABLE notification_deliveries DROP COLUMN IF EXISTS bounce_type;
-- COMMIT;
-- =============================================================================
