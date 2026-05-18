-- Platform notification fabric.
--
-- Module-specific producers (Source, Moves, Tower, Intelligence, Context,
-- Admin, Platform) write operating signals here. Delivery workers can then
-- fan out to in-app, email, digest, Slack/Teams, or webhooks without each
-- product surface inventing its own alert table.

CREATE TABLE IF NOT EXISTS platform_notification_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key          TEXT        NOT NULL,
  module              TEXT        NOT NULL
    CHECK (module IN (
      'home',
      'source',
      'moves',
      'tower',
      'intelligence',
      'context',
      'admin',
      'platform'
    )),
  severity            TEXT        NOT NULL
    CHECK (severity IN ('info', 'attention', 'urgent', 'critical')),
  source_event_type   TEXT        NOT NULL,
  subject_type        TEXT        NOT NULL,
  subject_id          TEXT        NOT NULL,
  subject_label       TEXT        NOT NULL,
  title               TEXT        NOT NULL,
  body_text           TEXT        NOT NULL,
  href                TEXT        NOT NULL,
  audience_jsonb      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  channels_jsonb      JSONB       NOT NULL DEFAULT '["in_app"]'::jsonb,
  evidence_refs_jsonb JSONB       NOT NULL DEFAULT '[]'::jsonb,
  dedupe_key          TEXT        NOT NULL,
  due_at              TIMESTAMPTZ,
  produced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at     TIMESTAMPTZ,
  acknowledged_by     UUID,
  metadata_jsonb      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_notification_events_tenant_module
  ON platform_notification_events (tenant_key, module, produced_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_notification_events_due
  ON platform_notification_events (tenant_key, severity, due_at ASC NULLS LAST);

ALTER TABLE platform_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_platform_notifications"
  ON platform_notification_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_select_tenant_platform_notifications"
  ON platform_notification_events
  FOR SELECT
  TO authenticated
  USING (
    replace(tenant_key, '-', '') = replace(COALESCE(
      NULLIF(auth.jwt() ->> 'tenant_key', ''),
      NULLIF(auth.jwt() ->> 'client_id', ''),
      NULLIF(auth.jwt() ->> 'clientId', '')
    ), '-', '')
  );
