-- Tower W3 · integration_health
-- Health snapshots for each registered integration.

BEGIN;

CREATE TABLE IF NOT EXISTS integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES data_integrations(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  health_status TEXT NOT NULL
    CHECK (health_status IN ('healthy','degraded','failed','paused')),
  freshness_minutes INT,
  stale_object_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  incident_summary TEXT,
  raw_health_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_integration_health_latest
  ON integration_health(integration_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_health_status
  ON integration_health(health_status, checked_at DESC);

ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_integration_health" ON integration_health;
CREATE POLICY "service_role_all_integration_health" ON integration_health
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
