-- Tower DORA metrics — per-repo, per-period canonical capture.
--
-- Complements existing `dora_baselines` (per-team weekly cadence) by
-- recording the four canonical DORA metrics at the GitHub repo /
-- monthly-period grain that the Tower ingestion pipeline (S1) populates
-- from `public/templates/tower/github-dora/template.xlsx`.
--
-- Why a sibling table rather than extending `dora_baselines`:
--
--   - `dora_baselines` carries `deploy_freq_per_week` (weekly rate),
--     `reliability_pct`, and is keyed by `(client_id, team_id, app_id,
--     measured_at)`. The Tower S1 source-system contract is keyed by
--     `(client_id, repo, team, period_start, period_end)` and carries
--     `deployment_frequency_per_day` plus `sample_size_deploys`.
--   - Extending in place would require breaking the existing
--     application-scoped foreign keys.
--   - The two tables are aggregated through the same Tower read model
--     (`src/lib/tower/ai-productivity-dora.ts`) — no consumer needs to
--     query both directly.
--
-- Refresh cadence: weekly ingest, monthly period grain.
-- Ownership: AI Control Tower — Platform Squad.
-- Real-world extract path (documented in
-- `docs/templates/tower/github-dora/README.md`):
--
--   GitHub Actions deployments API
--     + Pull-Request merge events
--     + Incidents tagged `incident:*`
--   → reducer (per repo × month)
--   → `template.xlsx` (Data sheet)
--   → `npx tsx src/scripts/tower/ingest-github-dora.ts ...`
--   → this table.

BEGIN;

CREATE TABLE IF NOT EXISTS tower_dora_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  repo TEXT NOT NULL,
  team TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  deployment_frequency_per_day NUMERIC(10,4) NOT NULL
    CHECK (deployment_frequency_per_day >= 0),
  lead_time_for_changes_hours NUMERIC(12,2) NOT NULL
    CHECK (lead_time_for_changes_hours >= 0),
  change_failure_rate_pct NUMERIC(5,2) NOT NULL
    CHECK (change_failure_rate_pct >= 0 AND change_failure_rate_pct <= 100),
  mttr_hours NUMERIC(12,2) NOT NULL
    CHECK (mttr_hours >= 0),
  sample_size_deploys INTEGER NOT NULL
    CHECK (sample_size_deploys >= 0),
  source TEXT NOT NULL DEFAULT 'github_actions_xlsx_ingest',
  source_file_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  CHECK (period_end >= period_start),
  UNIQUE (client_id, repo, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_tower_dora_metrics_client_period
  ON tower_dora_metrics(client_id, period_start DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tower_dora_metrics_team
  ON tower_dora_metrics(client_id, team)
  WHERE deleted_at IS NULL;

COMMIT;
