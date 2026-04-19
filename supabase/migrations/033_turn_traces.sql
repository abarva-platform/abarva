-- Migration 033 · turn_traces — Pack D Principle 6 (trace drawer)
-- Idempotent. Per-turn JSONB reasoning-trace blob. Keyed by turn_id for
-- 1:1 with turns table. Small rows (<20KB), indexed by turn_id PK.

BEGIN;

CREATE TABLE IF NOT EXISTS turn_traces (
  turn_id UUID PRIMARY KEY REFERENCES turns(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  latency_ms INT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turn_traces_engagement ON turn_traces(engagement_id);

ALTER TABLE turn_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_turn_traces" ON turn_traces;
CREATE POLICY "service_role_all_turn_traces" ON turn_traces
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
