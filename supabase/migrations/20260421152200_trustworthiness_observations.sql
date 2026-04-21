-- Tower W3 · trustworthiness_observations
-- Raw observations contributing to a trustworthiness score for a use case.

BEGIN;

CREATE TABLE IF NOT EXISTS trustworthiness_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  observation_type TEXT NOT NULL
    CHECK (observation_type IN ('baseline_locked','automated_measurement','recent_attestation','multi_attester','evidence_completeness')),
  observation_state TEXT NOT NULL
    CHECK (observation_state IN ('met','partial','missing','expired')),
  points_awarded INT NOT NULL DEFAULT 0,
  attester_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ref TEXT,
  details_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trustworthiness_observations_use_case
  ON trustworthiness_observations(use_case_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trustworthiness_observations_client
  ON trustworthiness_observations(client_id, observation_type, observed_at DESC);

ALTER TABLE trustworthiness_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_trustworthiness_observations" ON trustworthiness_observations;
CREATE POLICY "service_role_all_trustworthiness_observations" ON trustworthiness_observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
