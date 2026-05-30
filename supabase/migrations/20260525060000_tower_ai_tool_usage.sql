-- migration:destructive-allowed
-- Tower · AI coding-tool usage + cost ledger.
--
-- Shared landing table for Copilot (S2), Claude Code (S3), and Cursor (S4)
-- ingest slices. The `tool` column discriminates source. Sister slices
-- extend this table additively — never drop columns; only ADD COLUMN IF NOT
-- EXISTS so the migration is safe to re-run and forward-compatible.

BEGIN;

DO $$ BEGIN
  CREATE TYPE tower_ai_tool_kind AS ENUM ('github_copilot', 'claude_code', 'cursor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tower_ai_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tool tower_ai_tool_kind NOT NULL,
  team TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  active_users INTEGER NOT NULL DEFAULT 0 CHECK (active_users >= 0),
  total_suggestions INTEGER NOT NULL DEFAULT 0 CHECK (total_suggestions >= 0),
  accepted_suggestions INTEGER NOT NULL DEFAULT 0 CHECK (accepted_suggestions >= 0),
  acceptance_rate_pct NUMERIC(5,2) CHECK (
    acceptance_rate_pct IS NULL OR (acceptance_rate_pct >= 0 AND acceptance_rate_pct <= 100)
  ),
  monthly_cost_usd NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (monthly_cost_usd >= 0),
  seats_assigned INTEGER NOT NULL DEFAULT 0 CHECK (seats_assigned >= 0),
  seats_used INTEGER NOT NULL DEFAULT 0 CHECK (seats_used >= 0),
  source_file_id TEXT,
  ingest_run_id TEXT,
  raw_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_ai_tool_usage_period_chk CHECK (period_end >= period_start),
  CONSTRAINT tower_ai_tool_usage_acceptance_chk CHECK (accepted_suggestions <= total_suggestions),
  CONSTRAINT tower_ai_tool_usage_seats_chk CHECK (seats_used <= seats_assigned)
);

-- Idempotency: re-ingesting the same (client, tool, team, period) updates
-- in place rather than creating duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS tower_ai_tool_usage_unique_idx
  ON tower_ai_tool_usage (client_id, tool, team, period_start, period_end);

CREATE INDEX IF NOT EXISTS tower_ai_tool_usage_client_tool_idx
  ON tower_ai_tool_usage (client_id, tool, period_end DESC);

-- Forward-compatible ADD COLUMN IF NOT EXISTS — sister slices append here.
ALTER TABLE tower_ai_tool_usage ADD COLUMN IF NOT EXISTS source_file_id TEXT;
ALTER TABLE tower_ai_tool_usage ADD COLUMN IF NOT EXISTS ingest_run_id TEXT;
ALTER TABLE tower_ai_tool_usage ADD COLUMN IF NOT EXISTS raw_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON TABLE tower_ai_tool_usage IS
  'Per-team monthly usage + cost for AI coding tools (Copilot, Claude Code, Cursor). Tower ingest target.';
COMMENT ON COLUMN tower_ai_tool_usage.tool IS
  'Discriminator: which AI coding tool this row describes.';
COMMENT ON COLUMN tower_ai_tool_usage.acceptance_rate_pct IS
  'Accepted / total suggestions × 100. Null when total = 0.';

COMMIT;
