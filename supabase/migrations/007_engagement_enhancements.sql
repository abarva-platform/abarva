-- BUILD 0 — Engagement enhancements: sponsor, function, P&L tagging,
-- success metrics, monthly actuals, milestones, genome contributions,
-- benchmark history.

-- ── Alter engagements table ──────────────────────────────────────────────────
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS cxo_sponsor_name        TEXT,
  ADD COLUMN IF NOT EXISTS cxo_sponsor_title        TEXT,
  ADD COLUMN IF NOT EXISTS cxo_sponsor_email        TEXT,
  ADD COLUMN IF NOT EXISTS business_function        TEXT
    CHECK (business_function IN (
      'Revenue Cycle','Technology','Finance','Operations',
      'Clinical','Supply Chain','HR','Legal','Strategy'
    )),
  ADD COLUMN IF NOT EXISTS pl_impact_category       TEXT
    CHECK (pl_impact_category IN (
      'OpEx reduction','CapEx avoidance','Revenue protection',
      'Revenue growth','Risk mitigation','Regulatory compliance'
    )),
  ADD COLUMN IF NOT EXISTS strategic_priority       TEXT,
  ADD COLUMN IF NOT EXISTS verification_method      TEXT
    CHECK (verification_method IN (
      'Internal audit','External audit','CFO sign-off',
      'System data','Third-party benchmark'
    )),
  ADD COLUMN IF NOT EXISTS baseline_metrics         JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS success_metrics          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS milestone_dates          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS what_good_looks_like     TEXT,
  ADD COLUMN IF NOT EXISTS directive                TEXT,
  ADD COLUMN IF NOT EXISTS skip_setup               BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS engagement_id_readable   TEXT;

COMMENT ON COLUMN engagements.cxo_sponsor_name      IS 'Named executive sponsor (F002 pattern — required)';
COMMENT ON COLUMN engagements.business_function     IS 'Primary P&L function this engagement addresses';
COMMENT ON COLUMN engagements.pl_impact_category    IS 'How this maps to the P&L';
COMMENT ON COLUMN engagements.baseline_metrics      IS '[{metric_name, value, unit, source, locked_date, locked_by}]';
COMMENT ON COLUMN engagements.success_metrics       IS '[{metric_name, baseline, target, timeline, verification_method}]';
COMMENT ON COLUMN engagements.milestone_dates       IS '[{milestone_name, target_date, actual_date, status, notes}]';
COMMENT ON COLUMN engagements.directive             IS 'Verbatim leadership directive from engagement setup Q1';
COMMENT ON COLUMN engagements.skip_setup            IS 'TRUE when Phase 0 context pre-loaded from engagement setup';
COMMENT ON COLUMN engagements.engagement_id_readable IS 'Human-readable ID e.g. MER-RCM-001';

-- ── monthly_actuals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_actuals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id     UUID REFERENCES engagements(id) ON DELETE CASCADE,
  month_number      INTEGER NOT NULL,
  metric_name       TEXT NOT NULL,
  baseline_value    NUMERIC,
  actual_value      NUMERIC,
  improvement       NUMERIC,
  improvement_unit  TEXT,    -- %, bps, $, days
  verified          BOOLEAN  DEFAULT FALSE,
  verified_by       TEXT,
  verified_date     DATE,
  evidence_file_url TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_actuals_engagement ON monthly_actuals(engagement_id);
CREATE INDEX IF NOT EXISTS idx_monthly_actuals_month ON monthly_actuals(engagement_id, month_number);

-- ── engagement_milestones ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagement_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   UUID REFERENCES engagements(id) ON DELETE CASCADE,
  milestone_name  TEXT NOT NULL,
  target_date     DATE,
  actual_date     DATE,
  status          TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','hit','missed','at-risk')),
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_milestones_engagement ON engagement_milestones(engagement_id);

-- ── genome_contributions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS genome_contributions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id       UUID REFERENCES engagements(id) ON DELETE SET NULL,
  client_id           TEXT NOT NULL,
  pattern_id          TEXT NOT NULL,
  contribution_type   TEXT,
  contribution_date   DATE DEFAULT CURRENT_DATE,
  description         TEXT
);

-- ── benchmark_history ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS benchmark_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     TEXT NOT NULL,
  metric_name   TEXT NOT NULL,
  value         NUMERIC,
  peer_median   NUMERIC,
  date          DATE DEFAULT CURRENT_DATE,
  source        TEXT
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_client ON benchmark_history(client_id, metric_name);
