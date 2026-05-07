-- AIR-1 · AI Initiatives Registry — schema migration.
--
-- Per docs/build/intelligence/ai-initiatives-package/DATA_MODEL.md.
-- Creates the canonical registry: 8 categories (global lookup),
-- per-tenant business goals, the central ai_initiatives table, and
-- five supporting substrate tables (KPIs, stakeholder notes, decisions,
-- vendors, scenarios).
--
-- Tenant scoping: rows reference clients(id) (the existing tenant
-- table in this codebase). RLS policies match the established
-- pattern — service_role full access; tenant equality enforced via
-- the existing client_id column rather than tenant_key.
--
-- Provenance: every row carries a non-null loaded_via_template marker.
-- Day-1 manual loads use the template path; future integrations
-- replace with integration source IDs.

BEGIN;

-- ---------------------------------------------------------------------
-- ai_categories · global lookup (not tenant-scoped)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_categories (
  category_id    VARCHAR(10) PRIMARY KEY,
  name           VARCHAR(80) NOT NULL,
  definition     TEXT NOT NULL,
  typical_kpis   TEXT,
  typical_risks  TEXT,
  display_order  SMALLINT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_categories (category_id, name, definition, display_order) VALUES
  ('CAT-01', 'LLM Productivity',           'General-purpose AI assistants embedded in everyday work tools.', 1),
  ('CAT-02', 'Developer & IT SDLC AI',     'AI tools embedded in the software development and IT operations lifecycle.', 2),
  ('CAT-03', 'Agentic Operations',         'Autonomous or semi-autonomous AI agents that take action in operational systems.', 3),
  ('CAT-04', 'ERP & Domain Agents',        'AI embedded in enterprise resource planning and domain-specific business systems.', 4),
  ('CAT-05', 'Predictive ML',              'Traditional and modern machine learning for prediction, classification, scoring.', 5),
  ('CAT-06', 'AI Infrastructure & FinOps', 'Platform investments enabling other AI initiatives.', 6),
  ('CAT-07', 'Customer-Facing AI',         'AI that customers directly interact with.', 7),
  ('CAT-08', 'Compliance & Governance AI', 'AI that watches AI — automated control monitoring, audit, model risk.', 8)
ON CONFLICT (category_id) DO NOTHING;

ALTER TABLE ai_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_categories_read_authenticated"
  ON ai_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_categories_service_role_all"
  ON ai_categories FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_business_goals · per-tenant
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_business_goals (
  goal_id              VARCHAR(20) PRIMARY KEY,
  client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name                 VARCHAR(200) NOT NULL,
  strategic_context    TEXT NOT NULL,
  display_order        SMALLINT NOT NULL,
  loaded_via_template  VARCHAR(160) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_goals_client
  ON ai_business_goals(client_id, display_order);

ALTER TABLE ai_business_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_business_goals_service_role_all"
  ON ai_business_goals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_initiatives · central table
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_initiatives (
  initiative_id         VARCHAR(80) PRIMARY KEY,
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  display_id            VARCHAR(20) NOT NULL,
  name                  VARCHAR(200) NOT NULL,
  description           TEXT NOT NULL,

  primary_category_id   VARCHAR(10) NOT NULL REFERENCES ai_categories(category_id),
  secondary_category_id VARCHAR(10) REFERENCES ai_categories(category_id),

  primary_goal_id       VARCHAR(20) NOT NULL REFERENCES ai_business_goals(goal_id),

  stage                 VARCHAR(40) NOT NULL CHECK (stage IN (
    'pilot', 'scaled', 'sunset', 'multi_year_strategic_bet', 'in_strategic_move'
  )),
  stage_detail          VARCHAR(120),

  owner_name            VARCHAR(160) NOT NULL,
  owner_title           VARCHAR(160) NOT NULL,
  owner_function        VARCHAR(80),

  committed_annual_usd  NUMERIC(14,2),
  committed_total_usd   NUMERIC(14,2),
  measured_value_usd    NUMERIC(14,2),

  status_flag           VARCHAR(40) NOT NULL CHECK (status_flag IN (
    'healthy', 'adoption_gap', 'value_lag', 'cost_overrun',
    'duplication_risk', 'stalled', 'foundation_phase', 'in_move'
  )),
  status_summary        VARCHAR(400) NOT NULL,
  confidence_level      VARCHAR(10) NOT NULL CHECK (confidence_level IN ('HIGH', 'MED', 'LOW')),

  aligned_callout       BOOLEAN NOT NULL DEFAULT FALSE,
  aligned_rationale     TEXT,

  loaded_via_template   VARCHAR(160) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_initiatives_client    ON ai_initiatives(client_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_category  ON ai_initiatives(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_goal      ON ai_initiatives(primary_goal_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_stage     ON ai_initiatives(stage);
CREATE INDEX IF NOT EXISTS idx_initiatives_status    ON ai_initiatives(status_flag);
CREATE INDEX IF NOT EXISTS idx_initiatives_aligned
  ON ai_initiatives(client_id, aligned_callout) WHERE aligned_callout = TRUE;

ALTER TABLE ai_initiatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_initiatives_service_role_all"
  ON ai_initiatives FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_initiative_kpis
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_initiative_kpis (
  kpi_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(80) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  kpi_name             VARCHAR(160) NOT NULL,
  kpi_unit             VARCHAR(40),
  quarter              VARCHAR(10) NOT NULL,
  kpi_value            NUMERIC(16,4) NOT NULL,
  target_value         NUMERIC(16,4),
  peer_median          NUMERIC(16,4),
  confidence_level     VARCHAR(10) NOT NULL CHECK (confidence_level IN ('HIGH', 'MED', 'LOW')),
  loaded_via_template  VARCHAR(160) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (initiative_id, kpi_name, quarter)
);

CREATE INDEX IF NOT EXISTS idx_kpis_initiative_quarter
  ON ai_initiative_kpis(initiative_id, quarter);

ALTER TABLE ai_initiative_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_initiative_kpis_service_role_all"
  ON ai_initiative_kpis FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_initiative_stakeholder_notes
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_initiative_stakeholder_notes (
  note_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(80) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  stakeholder_name     VARCHAR(160) NOT NULL,
  stakeholder_title    VARCHAR(160) NOT NULL,
  interview_date       DATE NOT NULL,
  quote                TEXT NOT NULL,
  themes               VARCHAR(200)[],
  attribution_consent  BOOLEAN NOT NULL DEFAULT FALSE,
  loaded_via_template  VARCHAR(160) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stake_notes_initiative
  ON ai_initiative_stakeholder_notes(initiative_id);
CREATE INDEX IF NOT EXISTS idx_stake_notes_consent
  ON ai_initiative_stakeholder_notes(attribution_consent) WHERE attribution_consent = TRUE;

ALTER TABLE ai_initiative_stakeholder_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_initiative_stakeholder_notes_service_role_all"
  ON ai_initiative_stakeholder_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_initiative_decisions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_initiative_decisions (
  decision_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(80) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  decision_name        VARCHAR(240) NOT NULL,
  decision_date        DATE,
  sponsor_name         VARCHAR(160),
  decision_status      VARCHAR(20) NOT NULL CHECK (decision_status IN (
    'decided', 'pending', 'stalled', 'reversed'
  )),
  dissent_recorded     BOOLEAN NOT NULL DEFAULT FALSE,
  dissent_summary      TEXT,
  outcome_status       VARCHAR(60),
  loaded_via_template  VARCHAR(160) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_initiative
  ON ai_initiative_decisions(initiative_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status
  ON ai_initiative_decisions(decision_status);

ALTER TABLE ai_initiative_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_initiative_decisions_service_role_all"
  ON ai_initiative_decisions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_initiative_vendors
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_initiative_vendors (
  vendor_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(80) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  vendor_name          VARCHAR(160) NOT NULL,
  contract_value_usd   NUMERIC(14,2),
  renewal_date         DATE,
  financial_health     VARCHAR(20) CHECK (financial_health IN ('strong', 'moderate', 'watch', 'at_risk')),
  notes                TEXT,
  loaded_via_template  VARCHAR(160) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_initiative
  ON ai_initiative_vendors(initiative_id);
CREATE INDEX IF NOT EXISTS idx_vendors_renewal
  ON ai_initiative_vendors(renewal_date) WHERE renewal_date IS NOT NULL;

ALTER TABLE ai_initiative_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_initiative_vendors_service_role_all"
  ON ai_initiative_vendors FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- ai_initiative_scenarios
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_initiative_scenarios (
  scenario_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(80) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  scenario_name        VARCHAR(240) NOT NULL,
  trigger_event        VARCHAR(240),
  time_horizon_months  SMALLINT,
  probability_pct      SMALLINT CHECK (probability_pct BETWEEN 0 AND 100),
  impact_summary       TEXT NOT NULL,
  loaded_via_template  VARCHAR(160) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_initiative
  ON ai_initiative_scenarios(initiative_id);

ALTER TABLE ai_initiative_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_initiative_scenarios_service_role_all"
  ON ai_initiative_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- updated_at trigger function (shared with other tables in this repo)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ai_initiatives_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_business_goals_updated_at ON ai_business_goals;
CREATE TRIGGER trg_ai_business_goals_updated_at
  BEFORE UPDATE ON ai_business_goals
  FOR EACH ROW EXECUTE FUNCTION ai_initiatives_set_updated_at();

DROP TRIGGER IF EXISTS trg_ai_initiatives_updated_at ON ai_initiatives;
CREATE TRIGGER trg_ai_initiatives_updated_at
  BEFORE UPDATE ON ai_initiatives
  FOR EACH ROW EXECUTE FUNCTION ai_initiatives_set_updated_at();

COMMIT;
