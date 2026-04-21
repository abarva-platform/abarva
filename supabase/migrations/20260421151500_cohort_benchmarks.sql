-- Tower W3 · cohort_benchmarks
-- Computed percentile and median stats used by Tower peer comparisons.

BEGIN;

CREATE TABLE IF NOT EXISTS cohort_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_definition JSONB NOT NULL,
  cohort_segment_hash TEXT NOT NULL,
  pillar TEXT NOT NULL
    CHECK (pillar IN ('inventory','adoption','value','risk','cost','cross_pillar')),
  metric_name TEXT NOT NULL,
  sample_size INT NOT NULL CHECK (sample_size >= 1),
  p25 NUMERIC,
  p50 NUMERIC,
  p75 NUMERIC,
  p90 NUMERIC,
  mean_value NUMERIC,
  stddev_value NUMERIC,
  computation_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cohort_benchmarks_lookup
  ON cohort_benchmarks(cohort_segment_hash, pillar, metric_name, computed_at);
CREATE INDEX IF NOT EXISTS idx_cohort_benchmarks_metric_latest
  ON cohort_benchmarks(pillar, metric_name, computed_at DESC);

ALTER TABLE cohort_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_cohort_benchmarks" ON cohort_benchmarks;
CREATE POLICY "service_role_all_cohort_benchmarks" ON cohort_benchmarks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
