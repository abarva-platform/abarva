-- Tower budget rollup read model
--
-- Additive seam for CIO-grade portfolio budget slices. Program/initiative rows
-- remain in tower_read_model_initiatives; this table stores enterprise IT
-- budget rollups from F12/derived Tower files so Tower does not turn budget
-- lines into fake programs.

BEGIN;

CREATE TABLE IF NOT EXISTS public.tower_budget_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  period_label TEXT NOT NULL DEFAULT 'current',
  fiscal_year TEXT NOT NULL DEFAULT 'FY2026',
  portfolio_company TEXT NOT NULL,

  total_it_budget_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  actual_spend_ytd_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  forecast_spend_usd NUMERIC(14,2),
  opex_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  capex_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  run_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  change_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  vendor_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  labor_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  revenue_usd NUMERIC(16,2),
  employees INTEGER,
  it_spend_as_pct_revenue NUMERIC(10,6),

  source_file TEXT NOT NULL DEFAULT 'derived-tower-read-model/portfolio-company-spend.csv',
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tower_budget_rollups_key UNIQUE (client_id, period_label, fiscal_year, portfolio_company),
  CONSTRAINT tower_budget_rollups_nonnegative CHECK (
    total_it_budget_usd >= 0
    AND actual_spend_ytd_usd >= 0
    AND (forecast_spend_usd IS NULL OR forecast_spend_usd >= 0)
    AND opex_amount_usd >= 0
    AND capex_amount_usd >= 0
    AND run_amount_usd >= 0
    AND change_amount_usd >= 0
    AND vendor_amount_usd >= 0
    AND labor_amount_usd >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_tower_budget_rollups_client
  ON public.tower_budget_rollups(client_id, period_label);
CREATE INDEX IF NOT EXISTS idx_tower_budget_rollups_tenant
  ON public.tower_budget_rollups(tenant_key, period_label);

DROP TRIGGER IF EXISTS tower_budget_rollups_set_updated_at
  ON public.tower_budget_rollups;
CREATE TRIGGER tower_budget_rollups_set_updated_at
  BEFORE UPDATE ON public.tower_budget_rollups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.tower_budget_rollups ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['tower_budget_rollups']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_read ON public.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I_tenant_read ON public.%I FOR SELECT USING (can_read_tenant_by_key(tenant_key))',
      table_name,
      table_name
    );
  END LOOP;
END $$;

COMMIT;
