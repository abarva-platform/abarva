-- Tower W3 · portfolio_aggregates
-- Materialized client-level dashboard rollups for Tower.

BEGIN;

CREATE TABLE IF NOT EXISTS portfolio_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  aggregate_date DATE NOT NULL,
  active_use_case_count INT NOT NULL DEFAULT 0,
  critical_signal_count INT NOT NULL DEFAULT 0,
  warning_signal_count INT NOT NULL DEFAULT 0,
  governed_ai_spend_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  shadow_ai_spend_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  estimated_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  realized_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  average_trustworthiness_score NUMERIC(5,2),
  stale_integration_count INT NOT NULL DEFAULT 0,
  aggregate_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_aggregates_client_date
  ON portfolio_aggregates(client_id, aggregate_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_aggregates_client_computed
  ON portfolio_aggregates(client_id, computed_at DESC);

ALTER TABLE portfolio_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_portfolio_aggregates" ON portfolio_aggregates;
CREATE POLICY "service_role_all_portfolio_aggregates" ON portfolio_aggregates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
