-- Platform notification delivery audit.
--
-- `platform_notification_events` records the operating signal. This table
-- records each attempted external delivery (email now, future Slack/Teams,
-- webhook) as append-only evidence. Page renders never write here; only
-- dispatch workers should append rows.

CREATE TABLE IF NOT EXISTS platform_notification_deliveries (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key            TEXT        NOT NULL,
  notification_event_id UUID        NOT NULL REFERENCES platform_notification_events(id) ON DELETE CASCADE,
  channel               TEXT        NOT NULL
    CHECK (channel IN ('email_now', 'email_digest', 'slack', 'teams', 'webhook')),
  recipient_ref         TEXT        NOT NULL,
  recipient_email       TEXT,
  status                TEXT        NOT NULL
    CHECK (status IN ('sent', 'skipped', 'failed')),
  attempted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_message_id   TEXT,
  error_text            TEXT,
  metadata_jsonb        JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_platform_notification_deliveries_event
  ON platform_notification_deliveries (notification_event_id, channel, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_notification_deliveries_tenant
  ON platform_notification_deliveries (tenant_key, attempted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_platform_notification_delivery_sent
  ON platform_notification_deliveries (notification_event_id, channel, recipient_ref)
  WHERE status = 'sent';

ALTER TABLE platform_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_platform_notification_deliveries"
  ON platform_notification_deliveries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_select_tenant_platform_notification_deliveries"
  ON platform_notification_deliveries
  FOR SELECT
  TO authenticated
  USING (
    replace(tenant_key, '-', '') = replace(COALESCE(
      NULLIF(auth.jwt() ->> 'tenant_key', ''),
      NULLIF(auth.jwt() ->> 'client_id', ''),
      NULLIF(auth.jwt() ->> 'clientId', '')
    ), '-', '')
  );
