-- REASONING-PG-STATE · persistence backends for three reasoning stores.
--
-- Mirrors the pattern established by 20260428180000_reasoning_telemetry_events
-- for synthesis telemetry. Each of the three in-memory stores below has a
-- pluggable backend interface; this migration provides the table the Postgres
-- implementation writes through to when its env-var gate is on
-- (DATABASE_URL + REASONING_{MISSION,RESOLUTION,INGESTION}_BACKEND=postgres).
--
-- 1. reasoning_mission_states          — see src/lib/reasoning/mission-state-store.ts
-- 2. reasoning_resolved_contradictions — see src/lib/reasoning/contradiction-resolution-state.ts
-- 3. reasoning_evidence_ingestions     — see src/lib/reasoning/evidence-ingestion-store.ts

BEGIN;

CREATE TABLE IF NOT EXISTS reasoning_mission_states (
  mission_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('complete', 'dismissed')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reasoning_resolved_contradictions (
  contradiction_id TEXT PRIMARY KEY,
  resolved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reasoning_evidence_ingestions (
  id BIGSERIAL PRIMARY KEY,
  instance_id TEXT NOT NULL,
  item JSONB NOT NULL,
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_evidence_instance_id
  ON reasoning_evidence_ingestions (instance_id);

NOTIFY pgrst, 'reload schema';

COMMIT;
