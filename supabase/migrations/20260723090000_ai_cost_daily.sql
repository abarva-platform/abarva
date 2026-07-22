-- AI spend ledger — daily reconciliation and analytics rollup.
--
-- API-FIRST BY DESIGN. The variable, optimizable meter is the metered
-- ANTHROPIC_API_KEY carrying Nexus product inference. Claude Code runs on a
-- flat Max-plan seat ($213.20/month, verified 2026-07-22) and is a CAPACITY
-- concern, not a cost one; its notional token valuation must never land in a
-- billed-cost column.
--
-- Why not a new per-call ledger: `ai_egress_audit` (20260522170000) already
-- records every permitted, denied and failed model call. Product causality
-- belongs there, extended in place. This table is the daily reconciliation and
-- analytics grain on top of it.
--
-- THREE COST COLUMNS, NEVER SUMMED OR SUBSTITUTED FOR ONE ANOTHER:
--   billed_cost_usd    Provider truth. Anthropic cost_report only. Available at
--                      workspace/description grain — NULL at finer grains,
--                      because the provider does not bill at that grain.
--   allocated_cost_usd Billed cost apportioned to a finer grain (api key,
--                      module, workload) using token share. An internal
--                      estimate that reconciles UP to billed_cost_usd.
--   estimated_cost_usd Token count x list price, computed with no provider
--                      cost input at all. Used for Claude Code notional value
--                      and for pre-invoice projections.
-- A report that presents allocated or estimated cost as "actual billed" is
-- wrong. The CHECK constraint below enforces that pairing structurally.
--
-- Apply with `npm run db:migrate`.

BEGIN;

DO $$ BEGIN
  CREATE TYPE ai_cost_billing_source AS ENUM (
    'anthropic_cost_report',    -- provider billed truth
    'anthropic_usage_report',   -- provider token truth, cost allocated
    'ai_egress_audit',          -- internal per-call causality, cost estimated
    'claude_code_local'         -- flat-seat capacity, cost notional only
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_cost_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  usage_date DATE NOT NULL,
  billing_source ai_cost_billing_source NOT NULL,
  provider TEXT NOT NULL DEFAULT 'anthropic',

  -- Provider attribution (from the Admin API).
  workspace_id TEXT,
  api_key_id TEXT,
  api_key_alias TEXT,          -- human lane name; NEVER the key secret
  model TEXT,
  service_tier TEXT,
  context_window_band TEXT,
  description TEXT,            -- provider billing line label

  -- Product causality (from ai_egress_audit). Controlled vocabulary lives in
  -- src/lib/observability/ai-workload-taxonomy.ts — free-text values here
  -- fragment the report into dozens of near-duplicate names.
  module TEXT,
  workload TEXT,
  task_type TEXT,
  environment TEXT,
  tenant_key TEXT,

  -- Token shape. Cache writes split by TTL: the 1h write costs 2x base input
  -- and the 5m write 1.25x, while reads cost 0.1x. A 5m write pays for itself
  -- after ~1 reuse, a 1h write needs ~2 — collapsing them hides that decision.
  uncached_input_tokens BIGINT NOT NULL DEFAULT 0,
  cache_creation_5m_tokens BIGINT NOT NULL DEFAULT 0,
  cache_creation_1h_tokens BIGINT NOT NULL DEFAULT 0,
  cache_read_input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,

  -- Volume and quality counters. These are what make cost-per-accepted-output
  -- computable, which is the metric that should drive routing decisions.
  request_count BIGINT NOT NULL DEFAULT 0,
  retry_count BIGINT NOT NULL DEFAULT 0,
  failed_validation_count BIGINT NOT NULL DEFAULT 0,
  accepted_output_count BIGINT NOT NULL DEFAULT 0,
  web_search_requests BIGINT NOT NULL DEFAULT 0,

  billed_cost_usd NUMERIC(14, 6),
  allocated_cost_usd NUMERIC(14, 6),
  estimated_cost_usd NUMERIC(14, 6),

  -- Provenance for reconciliation and post-hoc reinterpretation.
  source_report_id TEXT,
  collector_version TEXT,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,

  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only the provider cost report may assert billed cost. Claude Code's flat
  -- seat may never assert billed OR allocated cost — its money is a
  -- subscription, not a per-token charge.
  CONSTRAINT ai_cost_daily_billed_requires_cost_report CHECK (
    billed_cost_usd IS NULL OR billing_source = 'anthropic_cost_report'
  ),
  CONSTRAINT ai_cost_daily_seat_is_notional_only CHECK (
    billing_source <> 'claude_code_local'
      OR (billed_cost_usd IS NULL AND allocated_cost_usd IS NULL)
  )
);

-- Collectors re-read a trailing window every run (late-arriving usage, partial
-- same-day buckets). Upsert on the full aggregation grain so a re-run corrects
-- a day in place instead of double counting it.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_cost_daily_grain
  ON public.ai_cost_daily (
    usage_date,
    billing_source,
    provider,
    COALESCE(workspace_id, ''),
    COALESCE(api_key_id, ''),
    COALESCE(model, ''),
    COALESCE(service_tier, ''),
    COALESCE(context_window_band, ''),
    COALESCE(description, ''),
    COALESCE(module, ''),
    COALESCE(workload, ''),
    COALESCE(task_type, ''),
    COALESCE(environment, ''),
    COALESCE(tenant_key, '')
  );

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_date_desc
  ON public.ai_cost_daily (usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_source_date
  ON public.ai_cost_daily (billing_source, usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_workload_date
  ON public.ai_cost_daily (workload, usage_date DESC)
  WHERE workload IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_model_date
  ON public.ai_cost_daily (model, usage_date DESC)
  WHERE model IS NOT NULL;

-- Billed truth per day. This is the only view that should ever be described as
-- "actual spend", and it is the figure that must reconcile to the Console.
CREATE OR REPLACE VIEW public.ai_cost_daily_billed AS
SELECT
  usage_date,
  provider,
  workspace_id,
  SUM(billed_cost_usd) AS billed_cost_usd
FROM public.ai_cost_daily
WHERE billing_source = 'anthropic_cost_report'
  AND billed_cost_usd IS NOT NULL
GROUP BY usage_date, provider, workspace_id;

-- Cache effectiveness. Read-ratio answers "is caching working at all";
-- the amortization ratios answer "is each TTL choice paying for itself".
-- A 1h write with under ~2 reads is losing money against a 5m write.
CREATE OR REPLACE VIEW public.ai_cost_daily_cache_health AS
SELECT
  usage_date,
  billing_source,
  model,
  workload,
  SUM(cache_read_input_tokens) AS cache_read_tokens,
  SUM(cache_creation_5m_tokens) AS cache_write_5m_tokens,
  SUM(cache_creation_1h_tokens) AS cache_write_1h_tokens,
  CASE
    WHEN SUM(
      uncached_input_tokens + cache_creation_5m_tokens
        + cache_creation_1h_tokens + cache_read_input_tokens
    ) > 0
    THEN ROUND(
      SUM(cache_read_input_tokens)::numeric
        / SUM(
            uncached_input_tokens + cache_creation_5m_tokens
              + cache_creation_1h_tokens + cache_read_input_tokens
          )::numeric, 4)
    ELSE NULL
  END AS cache_read_ratio,
  CASE
    WHEN SUM(cache_creation_5m_tokens) > 0
    THEN ROUND(
      SUM(cache_read_input_tokens)::numeric
        / SUM(cache_creation_5m_tokens)::numeric, 2)
    ELSE NULL
  END AS reads_per_5m_write,
  CASE
    WHEN SUM(cache_creation_1h_tokens) > 0
    THEN ROUND(
      SUM(cache_read_input_tokens)::numeric
        / SUM(cache_creation_1h_tokens)::numeric, 2)
    ELSE NULL
  END AS reads_per_1h_write
FROM public.ai_cost_daily
GROUP BY usage_date, billing_source, model, workload;

-- Value per unit of accepted work. More actionable than cost per million
-- tokens: a cheap model that fails validation twice costs more than one that
-- succeeds once.
CREATE OR REPLACE VIEW public.ai_cost_daily_yield AS
SELECT
  usage_date,
  module,
  workload,
  model,
  SUM(request_count) AS requests,
  SUM(retry_count) AS retries,
  SUM(failed_validation_count) AS failed_validations,
  SUM(accepted_output_count) AS accepted_outputs,
  SUM(COALESCE(allocated_cost_usd, estimated_cost_usd)) AS attributed_cost_usd,
  CASE
    WHEN SUM(accepted_output_count) > 0
    THEN ROUND(
      SUM(COALESCE(allocated_cost_usd, estimated_cost_usd))
        / SUM(accepted_output_count), 4)
    ELSE NULL
  END AS cost_per_accepted_output
FROM public.ai_cost_daily
WHERE billing_source <> 'claude_code_local'
GROUP BY usage_date, module, workload, model;

-- Operator/finance data, not tenant data. `tenant_key` may appear for internal
-- attribution but this table is never tenant-readable.
ALTER TABLE public.ai_cost_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_ai_cost_daily ON public.ai_cost_daily;
CREATE POLICY service_role_all_ai_cost_daily
  ON public.ai_cost_daily
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_cost_daily TO service_role;
REVOKE ALL ON public.ai_cost_daily FROM authenticated;
REVOKE ALL ON public.ai_cost_daily_billed FROM authenticated;
REVOKE ALL ON public.ai_cost_daily_cache_health FROM authenticated;
REVOKE ALL ON public.ai_cost_daily_yield FROM authenticated;

COMMENT ON TABLE public.ai_cost_daily IS
  'Daily AI spend reconciliation and analytics. Operator-only. billed/allocated/estimated cost are distinct and must never be summed or substituted.';
COMMENT ON COLUMN public.ai_cost_daily.billed_cost_usd IS
  'Provider truth from the Anthropic cost report. NULL at grains finer than the provider bills at. Enforced to only ever come from anthropic_cost_report.';
COMMENT ON COLUMN public.ai_cost_daily.allocated_cost_usd IS
  'Billed cost apportioned to a finer grain by token share. Internal estimate; must reconcile up to billed_cost_usd. Never present this as an invoice figure.';
COMMENT ON COLUMN public.ai_cost_daily.estimated_cost_usd IS
  'Tokens x list price, no provider cost input. Used for Claude Code notional value and pre-invoice projection.';
COMMENT ON COLUMN public.ai_cost_daily.api_key_alias IS
  'Human lane name for an api_key_id (e.g. prod-realtime). Never store the key secret.';

NOTIFY pgrst, 'reload schema';

COMMIT;
