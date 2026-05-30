-- Tower · Claude Code developer usage table.
--
-- Per-developer landing target for the S3 Claude Code ingest slice.
--
-- Grain note: this table holds per-developer monthly telemetry from the
-- Anthropic Console (developer_id, sessions, prompt/output tokens, primary
-- use case). Sister slices for Copilot (S2) and Cursor (S4) write into the
-- team-aggregate `tower_ai_tool_usage` table on a different grain (seats /
-- active users / completions / monthly cost). Different fact, different
-- grain, different table — Tower lenses union across both for cross-tool
-- rollups. Forcing both grains into one table would mean half the columns
-- are nullable on every row, which is the anti-pattern this split avoids.
--
-- Idempotency: a feed re-running for the same (tenant, developer, period_start)
-- updates the row in place via ON CONFLICT. The unique index defines the
-- natural key.

BEGIN;

CREATE TABLE IF NOT EXISTS public.tower_claude_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_client_key TEXT NOT NULL,
  team TEXT,
  developer_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sessions INTEGER,
  prompt_tokens BIGINT,
  output_tokens BIGINT,
  monthly_cost_usd NUMERIC(12, 2),
  primary_use_case TEXT,
  source_file TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_claude_code_usage_period_ck
    CHECK (period_end >= period_start),
  CONSTRAINT tower_claude_code_usage_tokens_ck
    CHECK (
      (prompt_tokens IS NULL OR prompt_tokens >= 0) AND
      (output_tokens IS NULL OR output_tokens >= 0) AND
      (sessions IS NULL OR sessions >= 0) AND
      (monthly_cost_usd IS NULL OR monthly_cost_usd >= 0)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS tower_claude_code_usage_natural_key_idx
  ON public.tower_claude_code_usage (tenant_client_key, developer_id, period_start);

CREATE INDEX IF NOT EXISTS tower_claude_code_usage_tenant_period_idx
  ON public.tower_claude_code_usage (tenant_client_key, period_start DESC);

ALTER TABLE public.tower_claude_code_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_tower_claude_code_usage ON public.tower_claude_code_usage;
CREATE POLICY service_role_all_tower_claude_code_usage
  ON public.tower_claude_code_usage
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $tower_claude_code_usage_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_tower_claude_code_usage ON public.tower_claude_code_usage;
    CREATE POLICY authenticated_select_tower_claude_code_usage
      ON public.tower_claude_code_usage
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(tenant_client_key));

    DROP POLICY IF EXISTS authenticated_write_tower_claude_code_usage ON public.tower_claude_code_usage;
    CREATE POLICY authenticated_write_tower_claude_code_usage
      ON public.tower_claude_code_usage
      FOR ALL TO authenticated
      USING (can_write_tenant_by_key(tenant_client_key))
      WITH CHECK (can_write_tenant_by_key(tenant_client_key));
  ELSE
    RAISE NOTICE 'tower-claude-code-usage: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$tower_claude_code_usage_rls$;

GRANT SELECT, INSERT, UPDATE ON public.tower_claude_code_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tower_claude_code_usage TO service_role;

COMMENT ON TABLE public.tower_claude_code_usage IS
  'Per-developer Claude Code (Anthropic) monthly usage. Single-tool table; sister slices Copilot/Cursor land in team-aggregate tower_ai_tool_usage on a different grain. Natural key: (tenant_client_key, developer_id, period_start).';

COMMENT ON COLUMN public.tower_claude_code_usage.tenant_client_key IS
  'Tenant key (e.g. northwindretail, apexretail). RLS uses can_read_tenant_by_key / can_write_tenant_by_key.';

COMMENT ON COLUMN public.tower_claude_code_usage.developer_id IS
  'Stable developer identifier from the upstream tool. For Claude Code this is the Anthropic Console per-API-key tag or user ID.';

NOTIFY pgrst, 'reload schema';

COMMIT;
