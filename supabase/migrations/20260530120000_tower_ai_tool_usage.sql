-- Tower · AI tool developer usage table.
--
-- Shared upsert target for per-developer AI coding assistant usage feeds.
-- The `tool` discriminator distinguishes Claude Code (S3), GitHub Copilot (S2),
-- and Cursor (S4). Tower audit PR #2525 found zero live source integrations on
-- this surface; this migration is the foundation for the ingest slices that
-- close that gap.
--
-- Slice ownership (do not break for sister slices):
--   • S2 Copilot: tool = 'copilot'
--   • S3 Claude Code: tool = 'claude_code'  (this slice — landed first)
--   • S4 Cursor: tool = 'cursor'
--
-- Idempotency: a feed re-running for the same (tool, tenant, developer, period_start)
-- updates the row in place via ON CONFLICT. The unique index defines the natural key.

BEGIN;

CREATE TABLE IF NOT EXISTS public.tower_ai_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_client_key TEXT NOT NULL,
  tool TEXT NOT NULL
    CHECK (tool IN ('claude_code', 'copilot', 'cursor')),
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
  CONSTRAINT tower_ai_tool_usage_period_ck
    CHECK (period_end >= period_start),
  CONSTRAINT tower_ai_tool_usage_tokens_ck
    CHECK (
      (prompt_tokens IS NULL OR prompt_tokens >= 0) AND
      (output_tokens IS NULL OR output_tokens >= 0) AND
      (sessions IS NULL OR sessions >= 0) AND
      (monthly_cost_usd IS NULL OR monthly_cost_usd >= 0)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS tower_ai_tool_usage_natural_key_idx
  ON public.tower_ai_tool_usage (tool, tenant_client_key, developer_id, period_start);

CREATE INDEX IF NOT EXISTS tower_ai_tool_usage_tenant_period_idx
  ON public.tower_ai_tool_usage (tenant_client_key, period_start DESC);

CREATE INDEX IF NOT EXISTS tower_ai_tool_usage_tool_idx
  ON public.tower_ai_tool_usage (tool, tenant_client_key);

ALTER TABLE public.tower_ai_tool_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_tower_ai_tool_usage ON public.tower_ai_tool_usage;
CREATE POLICY service_role_all_tower_ai_tool_usage
  ON public.tower_ai_tool_usage
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $tower_ai_tool_usage_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_tower_ai_tool_usage ON public.tower_ai_tool_usage;
    CREATE POLICY authenticated_select_tower_ai_tool_usage
      ON public.tower_ai_tool_usage
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(tenant_client_key));

    DROP POLICY IF EXISTS authenticated_write_tower_ai_tool_usage ON public.tower_ai_tool_usage;
    CREATE POLICY authenticated_write_tower_ai_tool_usage
      ON public.tower_ai_tool_usage
      FOR ALL TO authenticated
      USING (can_write_tenant_by_key(tenant_client_key))
      WITH CHECK (can_write_tenant_by_key(tenant_client_key));
  ELSE
    RAISE NOTICE 'tower-ai-tool-usage: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$tower_ai_tool_usage_rls$;

GRANT SELECT, INSERT, UPDATE ON public.tower_ai_tool_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tower_ai_tool_usage TO service_role;

COMMENT ON TABLE public.tower_ai_tool_usage IS
  'Per-developer AI coding-assistant usage, monthly. Discriminator column `tool` distinguishes Claude Code, Copilot, and Cursor feeds. Natural key: (tool, tenant_client_key, developer_id, period_start).';

COMMENT ON COLUMN public.tower_ai_tool_usage.tool IS
  'Discriminator: claude_code (S3), copilot (S2), cursor (S4).';

COMMENT ON COLUMN public.tower_ai_tool_usage.tenant_client_key IS
  'Tenant key (e.g. northwindretail, apexretail). RLS uses can_read_tenant_by_key / can_write_tenant_by_key.';

COMMENT ON COLUMN public.tower_ai_tool_usage.developer_id IS
  'Stable developer identifier from the upstream tool. For Claude Code this is the Anthropic Console per-API-key tag or user ID.';

NOTIFY pgrst, 'reload schema';

COMMIT;
