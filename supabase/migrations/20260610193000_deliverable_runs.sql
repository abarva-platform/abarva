-- Deliverable runs — async status ledger for board-grade deliverable generation.
--
-- Board-grade generation is a six-pass Claude flow (~5–10 min) that cannot complete
-- inside a single HTTP request. The POST route creates a run row (status='running'),
-- kicks off the generation in the persistent app process, and returns the run id; the
-- background work updates this row on completion. The UI polls GET /runs/{id}. State
-- lives here (not in memory) because the app runs up to 2 replicas — a poll may hit a
-- different replica than the one that started the run.
--
-- Control-plane scoped; one row per generation attempt.

CREATE TABLE IF NOT EXISTS deliverable_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  tenant_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,
  archetype TEXT NOT NULL,
  deliverable_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'succeeded', 'blocked', 'failed')),
  artifact_id UUID NULL,
  section_count INT NULL,
  retrieved_evidence INT NULL,
  blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hot path: "the latest runs for this client" (poll + history).
CREATE INDEX IF NOT EXISTS idx_deliverable_runs_client
  ON deliverable_runs (client_id, created_at DESC);

ALTER TABLE deliverable_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_deliverable_runs" ON deliverable_runs;
CREATE POLICY "service_role_all_deliverable_runs" ON deliverable_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_deliverable_runs" ON deliverable_runs;
CREATE POLICY "authenticated_read_deliverable_runs" ON deliverable_runs
  FOR SELECT TO authenticated
  USING (tenant_key = (auth.jwt() ->> 'tenant_key'));
