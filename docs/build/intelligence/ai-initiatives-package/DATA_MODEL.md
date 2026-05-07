# Data Model · Database Schema for AI Initiatives Registry

PostgreSQL DDL. All tables tenant-scoped via `tenant_id` foreign key. All records carry `loaded_via_template` provenance field.

---

## Schema overview

```
tenants                         (existing — no change)
  └── ai_business_goals         (new)
       └── ai_initiatives       (new — central table)
            ├── ai_initiative_kpis              (new)
            ├── ai_initiative_stakeholder_notes (new)
            ├── ai_initiative_decisions         (new)
            ├── ai_initiative_vendors           (new)
            └── ai_initiative_scenarios         (new)
ai_categories                   (new — global lookup, not tenant-scoped)
```

---

## Table: ai_categories (global lookup)

```sql
CREATE TABLE ai_categories (
  category_id      VARCHAR(10) PRIMARY KEY,    -- 'CAT-01' through 'CAT-08'
  name             VARCHAR(80) NOT NULL,
  definition       TEXT NOT NULL,
  typical_kpis     TEXT,
  typical_risks    TEXT,
  display_order    SMALLINT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_categories (category_id, name, definition, display_order) VALUES
  ('CAT-01', 'LLM Productivity',           'General-purpose AI assistants embedded in everyday work tools.', 1),
  ('CAT-02', 'Developer & IT SDLC AI',     'AI tools embedded in the software development and IT operations lifecycle.', 2),
  ('CAT-03', 'Agentic Operations',         'Autonomous or semi-autonomous AI agents that take action in operational systems.', 3),
  ('CAT-04', 'ERP & Domain Agents',        'AI embedded in enterprise resource planning and domain-specific business systems.', 4),
  ('CAT-05', 'Predictive ML',              'Traditional and modern machine learning for prediction, classification, scoring.', 5),
  ('CAT-06', 'AI Infrastructure & FinOps', 'Platform investments enabling other AI initiatives.', 6),
  ('CAT-07', 'Customer-Facing AI',         'AI that customers directly interact with.', 7),
  ('CAT-08', 'Compliance & Governance AI', 'AI that watches AI — automated control monitoring, audit, model risk.', 8);
```

---

## Table: ai_business_goals

```sql
CREATE TABLE ai_business_goals (
  goal_id              VARCHAR(20) PRIMARY KEY,   -- e.g. 'FCF-GOAL-01'
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 VARCHAR(200) NOT NULL,
  strategic_context    TEXT NOT NULL,
  display_order        SMALLINT NOT NULL,
  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_goals_tenant ON ai_business_goals(tenant_id, display_order);
```

---

## Table: ai_initiatives (central)

```sql
CREATE TABLE ai_initiatives (
  initiative_id        VARCHAR(60) PRIMARY KEY,   -- e.g. 'fcf-ml-credit-decisioning-2026'
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_id           VARCHAR(20) NOT NULL,      -- e.g. 'FCF-04' for human reference
  name                 VARCHAR(200) NOT NULL,
  description          TEXT NOT NULL,

  primary_category_id  VARCHAR(10) NOT NULL REFERENCES ai_categories(category_id),
  secondary_category_id VARCHAR(10) REFERENCES ai_categories(category_id),

  primary_goal_id      VARCHAR(20) NOT NULL REFERENCES ai_business_goals(goal_id),

  stage                VARCHAR(40) NOT NULL CHECK (stage IN (
    'pilot', 'scaled', 'sunset', 'multi_year_strategic_bet', 'in_strategic_move'
  )),
  stage_detail         VARCHAR(80),               -- e.g. 'Year 1 of 2', '40% of inbound chat'

  owner_name           VARCHAR(120) NOT NULL,
  owner_title          VARCHAR(120) NOT NULL,
  owner_function       VARCHAR(80),               -- 'IT', 'Finance', 'Operations', etc.

  committed_annual_usd NUMERIC(12,2),             -- annual run-rate
  committed_total_usd  NUMERIC(12,2),             -- total committed if multi-year
  measured_value_usd   NUMERIC(12,2),             -- realized value to date

  status_flag          VARCHAR(40) NOT NULL CHECK (status_flag IN (
    'healthy', 'adoption_gap', 'value_lag', 'cost_overrun',
    'duplication_risk', 'stalled', 'foundation_phase', 'in_move'
  )),
  status_summary       VARCHAR(400) NOT NULL,
  confidence_level     VARCHAR(10) NOT NULL CHECK (confidence_level IN ('HIGH','MED','LOW')),

  aligned_callout      BOOLEAN NOT NULL DEFAULT FALSE,
  aligned_rationale    TEXT,                      -- only populated when aligned_callout = true

  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_initiatives_tenant         ON ai_initiatives(tenant_id);
CREATE INDEX idx_initiatives_category       ON ai_initiatives(primary_category_id);
CREATE INDEX idx_initiatives_goal           ON ai_initiatives(primary_goal_id);
CREATE INDEX idx_initiatives_stage          ON ai_initiatives(stage);
CREATE INDEX idx_initiatives_status         ON ai_initiatives(status_flag);
CREATE INDEX idx_initiatives_aligned        ON ai_initiatives(tenant_id, aligned_callout) WHERE aligned_callout = TRUE;
```

---

## Table: ai_initiative_kpis

```sql
CREATE TABLE ai_initiative_kpis (
  kpi_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(60) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  kpi_name             VARCHAR(120) NOT NULL,
  kpi_unit             VARCHAR(40),                  -- '%', '$M', 'count', 'days', 'NPS pts'
  quarter              VARCHAR(10) NOT NULL,         -- 'Q1-2024', 'Q2-2026'
  kpi_value            NUMERIC(14,4) NOT NULL,
  target_value         NUMERIC(14,4),
  peer_median          NUMERIC(14,4),
  confidence_level     VARCHAR(10) NOT NULL CHECK (confidence_level IN ('HIGH','MED','LOW')),
  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(initiative_id, kpi_name, quarter)
);

CREATE INDEX idx_kpis_initiative_quarter ON ai_initiative_kpis(initiative_id, quarter);
```

---

## Table: ai_initiative_stakeholder_notes

```sql
CREATE TABLE ai_initiative_stakeholder_notes (
  note_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(60) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  stakeholder_name     VARCHAR(120) NOT NULL,
  stakeholder_title    VARCHAR(120) NOT NULL,
  interview_date       DATE NOT NULL,
  quote                TEXT NOT NULL,
  themes               VARCHAR(200)[],               -- e.g. {'governance', 'capacity', 'cost'}
  attribution_consent  BOOLEAN NOT NULL DEFAULT FALSE,
  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stake_notes_initiative ON ai_initiative_stakeholder_notes(initiative_id);
CREATE INDEX idx_stake_notes_consent    ON ai_initiative_stakeholder_notes(attribution_consent) WHERE attribution_consent = TRUE;
```

---

## Table: ai_initiative_decisions

```sql
CREATE TABLE ai_initiative_decisions (
  decision_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(60) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  decision_name        VARCHAR(200) NOT NULL,
  decision_date        DATE,                          -- NULL if pending
  sponsor_name         VARCHAR(120),
  decision_status      VARCHAR(20) NOT NULL CHECK (decision_status IN (
    'decided', 'pending', 'stalled', 'reversed'
  )),
  dissent_recorded     BOOLEAN NOT NULL DEFAULT FALSE,
  dissent_summary      TEXT,
  outcome_status       VARCHAR(40),
  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decisions_initiative ON ai_initiative_decisions(initiative_id);
CREATE INDEX idx_decisions_status     ON ai_initiative_decisions(decision_status);
```

---

## Table: ai_initiative_vendors

```sql
CREATE TABLE ai_initiative_vendors (
  vendor_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(60) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  vendor_name          VARCHAR(120) NOT NULL,
  contract_value_usd   NUMERIC(12,2),
  renewal_date         DATE,
  financial_health     VARCHAR(20) CHECK (financial_health IN ('strong','moderate','watch','at_risk')),
  notes                TEXT,
  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_initiative ON ai_initiative_vendors(initiative_id);
CREATE INDEX idx_vendors_renewal    ON ai_initiative_vendors(renewal_date) WHERE renewal_date IS NOT NULL;
```

---

## Table: ai_initiative_scenarios

```sql
CREATE TABLE ai_initiative_scenarios (
  scenario_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id        VARCHAR(60) NOT NULL REFERENCES ai_initiatives(initiative_id) ON DELETE CASCADE,
  scenario_name        VARCHAR(200) NOT NULL,
  trigger_event        VARCHAR(200),
  time_horizon_months  SMALLINT,
  probability_pct      SMALLINT CHECK (probability_pct BETWEEN 0 AND 100),
  impact_summary       TEXT NOT NULL,
  loaded_via_template  VARCHAR(120) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenarios_initiative ON ai_initiative_scenarios(initiative_id);
```

---

## Provenance principle

Every table includes `loaded_via_template VARCHAR(120) NOT NULL`. This is the **day-1 manual-load marker** that future integrations will replace. Example values:

- `'tenant-templates/healthcare/meridian-health/initiatives.json v1.0.0'`
- `'tenant-templates/banking/first-capital/kpi-history.json v1.0.0'`
- `'integration:servicenow:cmdb v2026-04'` (when integration replaces template)

UI should surface this provenance via a small "loaded from..." link on each record. When migrating a tenant from manual template to integration, the value updates from template path to integration source.

---

## Migrations

```sql
-- migration: 2026_05_07_add_ai_initiatives_registry.sql

BEGIN;

-- 1. Categories (global lookup)
CREATE TABLE ai_categories (...);
INSERT INTO ai_categories ...;

-- 2. Business goals (tenant-scoped)
CREATE TABLE ai_business_goals (...);

-- 3. Initiatives (central table)
CREATE TABLE ai_initiatives (...);

-- 4. Supporting substrate
CREATE TABLE ai_initiative_kpis (...);
CREATE TABLE ai_initiative_stakeholder_notes (...);
CREATE TABLE ai_initiative_decisions (...);
CREATE TABLE ai_initiative_vendors (...);
CREATE TABLE ai_initiative_scenarios (...);

-- 5. Tag substrate version
INSERT INTO substrate_versions (component, version, applied_at) VALUES
  ('ai_initiatives', 'v1.0.0', NOW());

COMMIT;
```

Down migration drops all tables in reverse FK order.
