-- Agent-quality violation telemetry · L7 durable guard evidence
--
-- Persists post-hoc synthesis / Sentinel voice-consistency guard events
-- emitted by src/lib/intelligence/synthesis/violationsRecorder.ts.
--
-- The in-memory ring buffer remains useful for local development, but
-- the pilot dashboard needs durable evidence across Container App
-- revisions, scale-out replicas, and Azure Postgres restarts.

BEGIN;

CREATE TABLE IF NOT EXISTS agent_quality_violation_events (
  id                    TEXT PRIMARY KEY,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_timestamp       TIMESTAMPTZ NOT NULL,
  route                 TEXT NOT NULL,
  surface               TEXT,
  tenant_client_key     TEXT NOT NULL,
  user_id               TEXT,
  violation_count       INTEGER NOT NULL CHECK (violation_count >= 0),
  violation_types       TEXT[] NOT NULL DEFAULT '{}',
  violations            JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_length       INTEGER NOT NULL CHECK (response_length >= 0),
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_quality_violation_events_tenant_ts
  ON agent_quality_violation_events (tenant_client_key, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_agent_quality_violation_events_type_gin
  ON agent_quality_violation_events USING GIN (violation_types);

COMMENT ON TABLE agent_quality_violation_events IS
  'Append-only telemetry for post-hoc agent response quality guards. Stores synthesis validator and Sentinel voice/internal-consistency violations for pilot dashboard, SOC2 evidence, and drift analysis.';

COMMENT ON COLUMN agent_quality_violation_events.violation_count IS
  '0 means a clean turn was recorded; >0 means one or more guards fired.';

-- RLS: authenticated users may read their tenant's telemetry; writes
-- happen only through service-role application code. This keeps the
-- dashboard tenant-scoped while preventing client-side inserts.
ALTER TABLE agent_quality_violation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_read ON agent_quality_violation_events;
CREATE POLICY auth_read ON agent_quality_violation_events
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_client_key));

GRANT SELECT ON agent_quality_violation_events TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
