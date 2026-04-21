-- Tower W3 · cohort_peers
-- Synthetic or anonymized peer records used for cohort benchmark computation.

BEGIN;

CREATE TABLE IF NOT EXISTS cohort_peers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  cohort_kind TEXT NOT NULL DEFAULT 'composite'
    CHECK (cohort_kind IN ('composite','anonymized_client','synthetic')),
  industry_code TEXT,
  revenue_band TEXT,
  workforce_band TEXT,
  primary_tech_stack TEXT,
  regulatory_profile TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  geography_region TEXT,
  annual_revenue_usd NUMERIC(14,2),
  employee_count INT,
  ai_budget_usd NUMERIC(14,2),
  portfolio_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cohort_peers_active
  ON cohort_peers(active);
CREATE INDEX IF NOT EXISTS idx_cohort_peers_industry
  ON cohort_peers(industry_code, revenue_band, workforce_band);
CREATE INDEX IF NOT EXISTS idx_cohort_peers_source_client
  ON cohort_peers(source_client_id);

DROP TRIGGER IF EXISTS cohort_peers_set_updated_at ON cohort_peers;
CREATE TRIGGER cohort_peers_set_updated_at BEFORE UPDATE ON cohort_peers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE cohort_peers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_cohort_peers" ON cohort_peers;
CREATE POLICY "service_role_all_cohort_peers" ON cohort_peers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
