-- Tower W3 · atlas_observations
-- Stored observations Atlas makes about a portfolio, signal, or use case.

BEGIN;

CREATE TABLE IF NOT EXISTS atlas_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  atlas_thread_id UUID REFERENCES atlas_threads(id) ON DELETE SET NULL,
  signal_firing_id UUID REFERENCES signal_firings(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  pillar TEXT
    CHECK (pillar IN ('inventory','adoption','value','risk','cost','cross_pillar')),
  observation_kind TEXT NOT NULL
    CHECK (observation_kind IN ('summary','recommendation','risk_callout','cohort_context','anomaly')),
  severity TEXT
    CHECK (severity IN ('critical','warning','info')),
  summary TEXT NOT NULL,
  details_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  route_type TEXT NOT NULL DEFAULT 'scripted'
    CHECK (route_type IN ('scripted','llm','hybrid','rule')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atlas_observations_client_created
  ON atlas_observations(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atlas_observations_signal
  ON atlas_observations(signal_firing_id, created_at DESC)
  WHERE signal_firing_id IS NOT NULL;

ALTER TABLE atlas_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_atlas_observations" ON atlas_observations;
CREATE POLICY "service_role_all_atlas_observations" ON atlas_observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
