-- REASONING-PG-STATE · alert acknowledgment / dismissal persistence.
--
-- Adds the table the Postgres alert-acknowledgment backend writes through to
-- when its env-var gate is on (DATABASE_URL + REASONING_ALERT_BACKEND=postgres).
-- See src/lib/reasoning/alert-acknowledgment-state.ts and
-- src/lib/reasoning/alert-acknowledgment-backends/postgres.ts.

BEGIN;

CREATE TABLE IF NOT EXISTS reasoning_alert_states (
  alert_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('acknowledged', 'dismissed')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

NOTIFY pgrst, 'reload schema';

COMMIT;
