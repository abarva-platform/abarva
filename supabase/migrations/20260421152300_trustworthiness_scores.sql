-- Tower W3 · trustworthiness_scores
-- Materialized trustworthiness score snapshots per use case.

BEGIN;

CREATE TABLE IF NOT EXISTS trustworthiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('high','medium','low')),
  baseline_locked_points INT NOT NULL DEFAULT 0,
  automated_measurement_points INT NOT NULL DEFAULT 0,
  recent_attestation_points INT NOT NULL DEFAULT 0,
  multi_attester_points INT NOT NULL DEFAULT 0,
  evidence_completeness_points INT NOT NULL DEFAULT 0,
  explanation_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trustworthiness_scores_latest
  ON trustworthiness_scores(use_case_id, computed_at);
CREATE INDEX IF NOT EXISTS idx_trustworthiness_scores_client
  ON trustworthiness_scores(client_id, score DESC, computed_at DESC);

ALTER TABLE trustworthiness_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_trustworthiness_scores" ON trustworthiness_scores;
CREATE POLICY "service_role_all_trustworthiness_scores" ON trustworthiness_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
