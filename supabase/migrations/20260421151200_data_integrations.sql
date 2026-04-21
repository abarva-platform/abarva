-- Tower W3 · data_integrations
-- Connected third-party systems for Tower ingestion and monitoring.

BEGIN;

CREATE TABLE IF NOT EXISTS data_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected','partial','failed','paused','pending')),
  connection_ref TEXT,
  sync_frequency_minutes INT NOT NULL DEFAULT 60,
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  config_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disconnected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_data_integrations_client
  ON data_integrations(client_id, status);
CREATE INDEX IF NOT EXISTS idx_data_integrations_next_sync
  ON data_integrations(next_sync_at)
  WHERE next_sync_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS data_integrations_client_provider_type_key
  ON data_integrations(client_id, provider_name, integration_type);

DROP TRIGGER IF EXISTS data_integrations_set_updated_at ON data_integrations;
CREATE TRIGGER data_integrations_set_updated_at BEFORE UPDATE ON data_integrations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE data_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_data_integrations" ON data_integrations;
CREATE POLICY "service_role_all_data_integrations" ON data_integrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
