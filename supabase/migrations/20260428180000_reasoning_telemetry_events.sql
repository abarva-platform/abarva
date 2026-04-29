-- REASONING-PG-TELEMETRY · persistence backend for synthesis telemetry events.
--
-- The reasoning layer's synthesis-telemetry module keeps a 500-event ring
-- buffer in memory (see src/lib/reasoning/synthesis-telemetry.ts). When the
-- Postgres backend is wired (REASONING_TELEMETRY_BACKEND=postgres + DATABASE_URL)
-- every recordSynthesisEvent / recordFeedback call write-throughs to this
-- table best-effort.
--
-- Schema mirrors SynthesisTelemetryEvent 1:1. id is the in-memory event id
-- (e.g. tlm_<base36>_<n>) so we can upsert by id in case the in-memory
-- write came first.

BEGIN;

CREATE TABLE IF NOT EXISTS reasoning_telemetry_events (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  surface TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  pattern_id TEXT,
  cache_hit BOOLEAN NOT NULL,
  latency_ms INTEGER NOT NULL,
  citation_count INTEGER NOT NULL,
  contradiction_count INTEGER NOT NULL,
  failure_mode_count INTEGER NOT NULL,
  gate_count INTEGER NOT NULL,
  feedback TEXT,
  feedback_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_telemetry_timestamp
  ON reasoning_telemetry_events (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_reasoning_telemetry_surface
  ON reasoning_telemetry_events (surface);

CREATE INDEX IF NOT EXISTS idx_reasoning_telemetry_pattern_id
  ON reasoning_telemetry_events (pattern_id) WHERE pattern_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
