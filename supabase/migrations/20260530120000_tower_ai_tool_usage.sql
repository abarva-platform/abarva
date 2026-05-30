-- migration:destructive-allowed
-- S2/S3/S4 shared landing table for live AI-coding-tool usage feeds.
-- Coordinated across:
--   S2  Copilot     (tool='copilot')
--   S3  Claude Code (tool='claude_code')
--   S4  Cursor      (tool='cursor')
--
-- Whichever slice ships first creates the table; later slices are no-op
-- thanks to IF NOT EXISTS. The `tool` discriminator scopes rows so each
-- slice ingests independently and idempotently on its natural key.
--
-- Grain: one row per (client, tool, team, period_start). One calendar
-- month is the canonical period (period_end is informational so the
-- semantics are explicit for partial months and future quarterly feeds).
BEGIN;

DO $$ BEGIN
  CREATE TYPE tower_ai_tool_kind AS ENUM ('copilot', 'claude_code', 'cursor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tower_ai_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tool tower_ai_tool_kind NOT NULL,
  team TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  seats_assigned INTEGER NOT NULL DEFAULT 0 CHECK (seats_assigned >= 0),
  active_users INTEGER NOT NULL DEFAULT 0 CHECK (active_users >= 0),
  completions_shown BIGINT NOT NULL DEFAULT 0 CHECK (completions_shown >= 0),
  completions_accepted BIGINT NOT NULL DEFAULT 0 CHECK (completions_accepted >= 0),
  monthly_cost_usd NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (monthly_cost_usd >= 0),
  source_file_id TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  CHECK (active_users <= seats_assigned),
  CHECK (completions_accepted <= completions_shown),
  UNIQUE (client_id, tool, team, period_start)
);

CREATE INDEX IF NOT EXISTS tower_ai_tool_usage_client_tool_idx
  ON tower_ai_tool_usage (client_id, tool, period_start DESC);

COMMIT;
