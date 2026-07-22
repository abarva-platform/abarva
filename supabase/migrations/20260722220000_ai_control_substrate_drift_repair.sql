-- AI Control Tower substrate — schema drift repair
--
-- Why this exists: on the live control Postgres, the migration ledger records
-- 20260616170000_ai_control_tower_substrate as applied, but its tables were
-- absent (verified: a governed Tower mart write reached the correct DB,
-- resolved the tenant, and produced the correct mart in memory, then failed at
-- `relation "ai_control_refresh_runs" does not exist`; `db:migrate --dry`
-- reported no pending migrations). That is ledger↔schema drift: the original
-- migration is marked applied so the runner will never re-execute it.
--
-- This is a NEW migration (new ledger id) so the runner picks it up as pending
-- and applies it. It re-declares the ai_control substrate using the SAME fully
-- idempotent DDL as 20260616170000 (CREATE TYPE guarded by EXCEPTION, CREATE
-- TABLE/INDEX IF NOT EXISTS, CREATE OR REPLACE VIEW, DROP POLICY IF EXISTS then
-- CREATE POLICY). Re-applying is safe whether the tables exist or not: on a
-- healthy DB it is a no-op; on the drifted DB it creates the missing objects.
--
-- It writes NO tenant/mart data. Populating cio_tower.facts / cio_tower.mart_*
-- remains a separate governed ACA data-build job. It does not edit the ledger
-- by hand and does not depend on re-running the ledger-applied original.
BEGIN;

DO $$ BEGIN
  CREATE TYPE ai_control_refresh_run_type AS ENUM (
    'template_upload',
    'api_sync',
    'admin_edit',
    'source_event',
    'move_event',
    'synthetic_seed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_control_refresh_status AS ENUM (
    'received',
    'parsed',
    'review_required',
    'committed',
    'indexed',
    'retrieval_verified',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_control_evidence_state AS ENUM (
    'received',
    'usable',
    'review_required',
    'low_confidence',
    'rejected',
    'retrieval_verified'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_control_action_posture AS ENUM (
    'scale',
    'freeze',
    'hold',
    'prove',
    'assign_owner',
    'monitor'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ai_control_refresh_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_key TEXT,
  refresh_run_key TEXT NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  run_type ai_control_refresh_run_type NOT NULL DEFAULT 'template_upload',
  status ai_control_refresh_status NOT NULL DEFAULT 'received',
  source_count INTEGER NOT NULL DEFAULT 0 CHECK (source_count >= 0),
  rows_seen INTEGER NOT NULL DEFAULT 0 CHECK (rows_seen >= 0),
  rows_valid INTEGER NOT NULL DEFAULT 0 CHECK (rows_valid >= 0),
  rows_rejected INTEGER NOT NULL DEFAULT 0 CHECK (rows_rejected >= 0),
  review_required_count INTEGER NOT NULL DEFAULT 0 CHECK (review_required_count >= 0),
  receipt_uri TEXT,
  parser_version TEXT,
  source_fingerprint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ,
  indexed_at TIMESTAMPTZ,
  retrieval_verified_at TIMESTAMPTZ,
  CHECK (reporting_period_end >= reporting_period_start),
  UNIQUE (client_id, refresh_run_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_control_refresh_runs_client_period
  ON ai_control_refresh_runs (client_id, reporting_period_end DESC);

CREATE TABLE IF NOT EXISTS ai_control_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_name TEXT NOT NULL,
  owner_role TEXT,
  cadence TEXT,
  data_class TEXT NOT NULL DEFAULT 'internal'
    CHECK (data_class IN ('public','internal','confidential','restricted')),
  period_end DATE,
  refresh_status TEXT NOT NULL DEFAULT 'received',
  source_fingerprint TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, source_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_control_sources_client_system
  ON ai_control_sources (client_id, source_system, period_end DESC);

CREATE TABLE IF NOT EXISTS ai_control_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  initiative_key TEXT NOT NULL,
  initiative_name TEXT NOT NULL,
  category TEXT,
  stage TEXT,
  business_owner_role TEXT,
  executive_sponsor_role TEXT,
  vendor TEXT,
  tool_or_system TEXT,
  impacted_personas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  promised_benefit TEXT,
  target_metric_key TEXT,
  baseline_value NUMERIC,
  target_value NUMERIC,
  target_date DATE,
  status_flag TEXT,
  record_version INTEGER NOT NULL DEFAULT 1 CHECK (record_version >= 1),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, initiative_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_control_initiatives_client_current
  ON ai_control_initiatives (client_id, stage, status_flag)
  WHERE is_current;

CREATE TABLE IF NOT EXISTS ai_control_tool_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  tool_key TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  vendor TEXT,
  user_group_or_team TEXT NOT NULL,
  persona TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  licensed_seats INTEGER CHECK (licensed_seats IS NULL OR licensed_seats >= 0),
  active_users INTEGER CHECK (active_users IS NULL OR active_users >= 0),
  usage_events BIGINT CHECK (usage_events IS NULL OR usage_events >= 0),
  accepted_or_completed_events BIGINT CHECK (accepted_or_completed_events IS NULL OR accepted_or_completed_events >= 0),
  utilization_pct NUMERIC(6,2) CHECK (utilization_pct IS NULL OR (utilization_pct >= 0 AND utilization_pct <= 100)),
  monthly_spend_usd NUMERIC(14,2) CHECK (monthly_spend_usd IS NULL OR monthly_spend_usd >= 0),
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE (client_id, refresh_run_id, tool_key, user_group_or_team, period_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_control_tool_usage_client_period
  ON ai_control_tool_usage_monthly (client_id, period_end DESC, tool_name);

CREATE TABLE IF NOT EXISTS ai_control_persona_productivity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  persona_key TEXT NOT NULL,
  persona_name TEXT NOT NULL,
  function_name TEXT,
  workflow TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  unit TEXT,
  baseline_value NUMERIC,
  current_value NUMERIC,
  target_value NUMERIC,
  initiative_key TEXT,
  confidence TEXT CHECK (confidence IS NULL OR confidence IN ('low','medium','high')),
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, persona_key, workflow, metric_key)
);

CREATE TABLE IF NOT EXISTS ai_control_dora_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  team TEXT NOT NULL,
  repo TEXT NOT NULL,
  tool_key TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  deployment_frequency_before NUMERIC,
  deployment_frequency_after NUMERIC,
  lead_time_hours_before NUMERIC,
  lead_time_hours_after NUMERIC,
  change_failure_rate_pct_before NUMERIC,
  change_failure_rate_pct_after NUMERIC,
  mttr_hours_before NUMERIC,
  mttr_hours_after NUMERIC,
  sample_size_deploys INTEGER CHECK (sample_size_deploys IS NULL OR sample_size_deploys >= 0),
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE (client_id, refresh_run_id, team, repo, period_start)
);

CREATE TABLE IF NOT EXISTS ai_control_agent_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  agent_key TEXT NOT NULL,
  vendor TEXT NOT NULL,
  module TEXT,
  agent_name TEXT NOT NULL,
  persona TEXT,
  workflow TEXT,
  eligible_volume NUMERIC,
  ai_touched_volume NUMERIC,
  auto_resolved_volume NUMERIC,
  cycle_time_before NUMERIC,
  cycle_time_after NUMERIC,
  quality_before NUMERIC,
  quality_after NUMERIC,
  monthly_spend_usd NUMERIC(14,2),
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, agent_key)
);

CREATE TABLE IF NOT EXISTS ai_control_benefit_realization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  benefit_key TEXT NOT NULL,
  initiative_key TEXT,
  benefit_name TEXT NOT NULL,
  metric_key TEXT,
  baseline_value NUMERIC,
  current_value NUMERIC,
  target_value NUMERIC,
  promised_annual_value_usd NUMERIC(14,2),
  realized_annual_value_usd NUMERIC(14,2),
  confidence TEXT CHECK (confidence IS NULL OR confidence IN ('low','medium','high')),
  readiness_state TEXT,
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, benefit_key)
);

CREATE TABLE IF NOT EXISTS ai_control_spend_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  spend_key TEXT NOT NULL,
  initiative_key TEXT,
  vendor TEXT NOT NULL,
  product_or_service TEXT NOT NULL,
  spend_type TEXT,
  monthly_spend_usd NUMERIC(14,2),
  annualized_spend_usd NUMERIC(14,2),
  renewal_date DATE,
  unit_economics_metric TEXT,
  unit_economics_value NUMERIC,
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, spend_key)
);

CREATE TABLE IF NOT EXISTS ai_control_risk_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES ai_control_sources(id) ON DELETE SET NULL,
  risk_key TEXT NOT NULL,
  initiative_key TEXT,
  dimension TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status TEXT,
  risk_description TEXT NOT NULL,
  owner_role TEXT,
  required_action TEXT,
  governance_gate TEXT CHECK (governance_gate IS NULL OR governance_gate IN ('pass','partial','fail')),
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'review_required',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, risk_key)
);

CREATE TABLE IF NOT EXISTS ai_control_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  related_record_type TEXT,
  related_record_key TEXT,
  posture ai_control_action_posture NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  owner_role TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'proposed',
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'review_required',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, action_key)
);

CREATE TABLE IF NOT EXISTS ai_control_evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  evidence_key TEXT NOT NULL,
  record_type TEXT,
  record_key TEXT,
  evidence_type TEXT NOT NULL,
  citation_label TEXT NOT NULL,
  citation_locator JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_pointer TEXT,
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, evidence_key)
);

CREATE TABLE IF NOT EXISTS ai_control_context_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  record_key TEXT NOT NULL,
  fact_key TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  fact_value JSONB NOT NULL DEFAULT 'null'::jsonb,
  fact_text TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  evidence_state ai_control_evidence_state NOT NULL DEFAULT 'received',
  evidence_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, record_type, record_key, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_control_context_facts_client_type
  ON ai_control_context_facts (client_id, record_type, fact_key);

CREATE TABLE IF NOT EXISTS ai_control_context_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  relationship_key TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  from_record_type TEXT NOT NULL,
  from_record_key TEXT NOT NULL,
  to_record_type TEXT NOT NULL,
  to_record_key TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, relationship_key)
);

CREATE TABLE IF NOT EXISTS ai_control_atlas_context_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  refresh_run_id UUID NOT NULL REFERENCES ai_control_refresh_runs(id) ON DELETE CASCADE,
  pack_key TEXT NOT NULL,
  lens TEXT NOT NULL,
  question_intent TEXT,
  visible_metric_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  context_json JSONB NOT NULL,
  evidence_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  retrieval_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, refresh_run_id, pack_key)
);

CREATE OR REPLACE VIEW ai_control_snapshot_summary AS
WITH tool_usage AS (
  SELECT
    refresh_run_id,
    SUM(monthly_spend_usd)::NUMERIC(14,2) AS monthly_ai_spend_usd,
    SUM(active_users) AS active_users,
    SUM(licensed_seats) AS licensed_seats
  FROM ai_control_tool_usage_monthly
  GROUP BY refresh_run_id
),
benefits AS (
  SELECT
    refresh_run_id,
    COUNT(DISTINCT benefit_key) FILTER (
      WHERE readiness_state NOT IN ('projected_only', 'baseline_set')
        OR realized_annual_value_usd IS NOT NULL
    ) AS measured_benefit_count
  FROM ai_control_benefit_realization
  GROUP BY refresh_run_id
),
evidence_review AS (
  SELECT
    refresh_run_id,
    COUNT(*) AS review_required_count
  FROM ai_control_evidence_items
  WHERE evidence_state IN ('review_required','low_confidence')
  GROUP BY refresh_run_id
)
SELECT
  r.client_id,
  r.id AS refresh_run_id,
  r.refresh_run_key,
  r.reporting_period_start,
  r.reporting_period_end,
  r.status,
  COALESCE(t.monthly_ai_spend_usd, 0)::NUMERIC(14,2) AS monthly_ai_spend_usd,
  CASE
    WHEN COALESCE(t.licensed_seats, 0) = 0 THEN NULL
    ELSE ROUND((t.active_users::NUMERIC / NULLIF(t.licensed_seats, 0)) * 100, 2)
  END AS active_adoption_pct,
  COALESCE(b.measured_benefit_count, 0) AS measured_benefit_count,
  COALESCE(e.review_required_count, 0) AS review_required_count
FROM ai_control_refresh_runs r
LEFT JOIN tool_usage t ON t.refresh_run_id = r.id
LEFT JOIN benefits b ON b.refresh_run_id = r.id
LEFT JOIN evidence_review e ON e.refresh_run_id = r.id;

ALTER TABLE ai_control_refresh_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_tool_usage_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_persona_productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_dora_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_agent_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_benefit_realization ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_spend_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_risk_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_context_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_context_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_control_atlas_context_packs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'ai_control_refresh_runs',
    'ai_control_sources',
    'ai_control_initiatives',
    'ai_control_tool_usage_monthly',
    'ai_control_persona_productivity',
    'ai_control_dora_metrics',
    'ai_control_agent_outcomes',
    'ai_control_benefit_realization',
    'ai_control_spend_contracts',
    'ai_control_risk_governance',
    'ai_control_actions',
    'ai_control_evidence_items',
    'ai_control_context_facts',
    'ai_control_context_relationships',
    'ai_control_atlas_context_packs'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_read_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "authenticated_read_%s" ON %I FOR SELECT TO authenticated USING (can_read_tenant_by_id(client_id))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_insert_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "authenticated_insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_id(client_id))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_update_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "authenticated_update_%s" ON %I FOR UPDATE TO authenticated USING (can_write_tenant_by_id(client_id)) WITH CHECK (can_write_tenant_by_id(client_id))', t, t);
  END LOOP;
END $$;

COMMENT ON TABLE ai_control_refresh_runs IS
  'AI Control Tower monthly/API refresh receipt. Report states separately: received, parsed, review_required, committed, indexed, retrieval_verified.';
COMMENT ON TABLE ai_control_context_facts IS
  'Atomic, citation-ready AI Control Tower facts used by Atlas context packs and retrieval chunks.';
COMMENT ON TABLE ai_control_atlas_context_packs IS
  'Stored Atlas Tower context bundles keyed by client, refresh, lens, and question intent.';

NOTIFY pgrst, 'reload schema';

COMMIT;
