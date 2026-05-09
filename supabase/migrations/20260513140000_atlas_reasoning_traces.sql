-- Atlas v1 · reasoning traces
-- Wide audit trail for Tower right-rail reasoning and metric explanations.

BEGIN;

CREATE TABLE IF NOT EXISTS atlas_reasoning_traces (
  trace_id VARCHAR(80) PRIMARY KEY,
  thread_id UUID REFERENCES atlas_threads(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id VARCHAR(120),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger VARCHAR(40) NOT NULL
    CHECK (trigger IN ('tower_right_rail_render','atlas_chat_turn','metric_explanation')),

  input_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  patterns_fired JSONB NOT NULL DEFAULT '[]'::jsonb,
  patterns_skipped JSONB NOT NULL DEFAULT '[]'::jsonb,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  if_you_only_do_one TEXT,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,

  interpretation_confidence VARCHAR(8) NOT NULL
    CHECK (interpretation_confidence IN ('high','med','low')),
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  fallback_reason VARCHAR(80),

  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  model VARCHAR(80) NOT NULL,
  prompt_version VARCHAR(80) NOT NULL,
  package_version VARCHAR(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_atlas_reasoning_traces_tenant_timestamp
  ON atlas_reasoning_traces(tenant_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_atlas_reasoning_traces_prompt_version
  ON atlas_reasoning_traces(prompt_version);

CREATE INDEX IF NOT EXISTS idx_atlas_reasoning_traces_fallback
  ON atlas_reasoning_traces(fallback_used, timestamp DESC);

ALTER TABLE atlas_reasoning_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_atlas_reasoning_traces" ON atlas_reasoning_traces;
CREATE POLICY "service_role_all_atlas_reasoning_traces" ON atlas_reasoning_traces
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_atlas_reasoning_traces" ON atlas_reasoning_traces;
CREATE POLICY "authenticated_read_atlas_reasoning_traces" ON atlas_reasoning_traces
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_id(tenant_id));

GRANT SELECT ON atlas_reasoning_traces TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
