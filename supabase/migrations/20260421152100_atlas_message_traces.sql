-- Tower W3 · atlas_message_traces
-- Telemetry and storage for Atlas turns and routing behavior.

BEGIN;

CREATE TABLE IF NOT EXISTS atlas_message_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atlas_thread_id UUID NOT NULL REFERENCES atlas_threads(id) ON DELETE CASCADE,
  atlas_observation_id UUID REFERENCES atlas_observations(id) ON DELETE SET NULL,
  turn_index INT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','atlas','system')),
  route_type TEXT NOT NULL
    CHECK (route_type IN ('scripted','llm','hybrid','tool_augmented')),
  content_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  tools_used TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  model_name TEXT,
  prompt_version TEXT,
  latency_ms INT,
  first_token_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (atlas_thread_id, turn_index)
);

CREATE INDEX IF NOT EXISTS idx_atlas_message_traces_thread_created
  ON atlas_message_traces(atlas_thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_atlas_message_traces_route_type
  ON atlas_message_traces(route_type, created_at DESC);

ALTER TABLE atlas_message_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_atlas_message_traces" ON atlas_message_traces;
CREATE POLICY "service_role_all_atlas_message_traces" ON atlas_message_traces
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
