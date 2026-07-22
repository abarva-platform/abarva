-- AI spend ledger — daily rollup.
--
-- Why a daily rollup and not a per-call ledger: per-call AI egress is already
-- audited in `ai_egress_audit` (migration 20260522170000), which records every
-- permitted, denied and failed model call with its request metadata including
-- usage. Adding a second per-call table would duplicate that and drift from it.
-- What is missing is not call detail — it is a cost-attributed daily series
-- that survives the Anthropic Admin API's own retention and can be trended,
-- alerted on, and reconciled against the invoice.
--
-- Two sources, deliberately never summed:
--   'anthropic_admin_api' — billed USD for the metered ANTHROPIC_API_KEY
--                           (Nexus product inference). Authoritative.
--   'claude_code_local'   — notional list-price valuation of Claude Code agent
--                           sessions, which authenticate on an OAuth seat and
--                           are NOT billed per token. Volume signal only.
-- `cost_basis` makes that distinction structural rather than a convention that
-- a future query can forget.
--
-- Apply with `npm run db:migrate`.

BEGIN;

DO $$ BEGIN
  CREATE TYPE ai_cost_source AS ENUM (
    'anthropic_admin_api',
    'claude_code_local'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_cost_basis AS ENUM (
    'billed',
    'notional_list_price'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_cost_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  usage_date DATE NOT NULL,
  source ai_cost_source NOT NULL,
  cost_basis ai_cost_basis NOT NULL,

  -- Attribution. Which key / workspace / workload produced the spend.
  -- `workload` is the lane label ('intelligence-runtime', 'tower-runtime',
  -- 'home-pack-generation', 'claude-code-development', ...). Separate API keys
  -- per lane are what make this column meaningful rather than guessed.
  model TEXT NOT NULL,
  api_key_id TEXT,
  workspace_id TEXT,
  workload TEXT,
  service_tier TEXT,

  -- Token shape. Split cache writes by TTL: the 1h write costs 2x base input
  -- and the 5m write 1.25x, so collapsing them hides a real and actionable
  -- price difference.
  uncached_input_tokens BIGINT NOT NULL DEFAULT 0,
  cache_write_5m_tokens BIGINT NOT NULL DEFAULT 0,
  cache_write_1h_tokens BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,

  calls BIGINT NOT NULL DEFAULT 0,
  web_search_requests BIGINT NOT NULL DEFAULT 0,

  cost_usd NUMERIC(12, 4) NOT NULL DEFAULT 0,

  -- Provenance: which collector run produced this row, and the raw grouping
  -- keys as returned, so a shape change upstream is diagnosable after the fact.
  collector_version TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collectors re-read a trailing window every run (late-arriving usage, partial
-- same-day buckets). Upsert on the natural key so a re-run corrects a day in
-- place instead of double counting it.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_cost_daily_natural_key
  ON public.ai_cost_daily (
    usage_date,
    source,
    model,
    COALESCE(api_key_id, ''),
    COALESCE(workspace_id, ''),
    COALESCE(workload, ''),
    COALESCE(service_tier, '')
  );

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_date_desc
  ON public.ai_cost_daily (usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_source_date
  ON public.ai_cost_daily (source, usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_workload_date
  ON public.ai_cost_daily (workload, usage_date DESC)
  WHERE workload IS NOT NULL;

-- Convenience view for the digest and any dashboard: one row per day per
-- source, with the cache-read ratio that diagnoses a caching regression.
CREATE OR REPLACE VIEW public.ai_cost_daily_summary AS
SELECT
  usage_date,
  source,
  cost_basis,
  SUM(cost_usd) AS cost_usd,
  SUM(calls) AS calls,
  SUM(output_tokens) AS output_tokens,
  SUM(cache_read_tokens) AS cache_read_tokens,
  SUM(
    uncached_input_tokens
      + cache_write_5m_tokens
      + cache_write_1h_tokens
      + cache_read_tokens
  ) AS input_side_tokens,
  CASE
    WHEN SUM(
      uncached_input_tokens
        + cache_write_5m_tokens
        + cache_write_1h_tokens
        + cache_read_tokens
    ) > 0
    THEN ROUND(
      SUM(cache_read_tokens)::numeric
        / SUM(
            uncached_input_tokens
              + cache_write_5m_tokens
              + cache_write_1h_tokens
              + cache_read_tokens
          )::numeric * 100,
      1
    )
    ELSE 0
  END AS cache_read_pct
FROM public.ai_cost_daily
GROUP BY usage_date, source, cost_basis;

-- This is operator/finance data, not tenant data: it has no tenant_id and must
-- never be readable by an authenticated tenant user. Service role only.
ALTER TABLE public.ai_cost_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_ai_cost_daily ON public.ai_cost_daily;
CREATE POLICY service_role_all_ai_cost_daily
  ON public.ai_cost_daily
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_cost_daily TO service_role;
REVOKE ALL ON public.ai_cost_daily FROM authenticated;
REVOKE ALL ON public.ai_cost_daily_summary FROM authenticated;

COMMENT ON TABLE public.ai_cost_daily IS
  'Daily AI spend rollup by source, model and workload. Operator-only (no tenant scope). Rows from source=claude_code_local carry cost_basis=notional_list_price and must not be added to billed spend.';

COMMENT ON COLUMN public.ai_cost_daily.cost_basis IS
  'billed = real invoiced USD (Anthropic Admin API cost report). notional_list_price = list-price valuation of OAuth-seat token volume; informational only.';

COMMENT ON COLUMN public.ai_cost_daily.workload IS
  'Lane label for attribution (intelligence-runtime, tower-runtime, home-pack-generation, claude-code-development). Only meaningful when each lane has its own API key.';

NOTIFY pgrst, 'reload schema';

COMMIT;
