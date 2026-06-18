-- Context insight materialization substrate.
-- Additive and tenant-scoped. This table is populated by
-- scripts/jobs/materialize-context-insights.cjs after a context refresh.

BEGIN;

CREATE TABLE IF NOT EXISTS significance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL UNIQUE,
  rule_key TEXT,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  severity_floor TEXT NOT NULL DEFAULT 'medium' CHECK (severity_floor IN ('low','medium','high')),
  evaluator_key TEXT NOT NULL,
  required_record_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS rule_id TEXT;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS rule_key TEXT;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS severity_floor TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS evaluator_key TEXT;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS required_record_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE significance_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE significance_rules
SET rule_id = rule_key
WHERE rule_id IS NULL
  AND rule_key IS NOT NULL;

UPDATE significance_rules
SET rule_key = rule_id
WHERE rule_key IS NULL
  AND rule_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS context_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  so_what TEXT NOT NULL,
  domain TEXT NOT NULL,
  materiality TEXT NOT NULL DEFAULT 'medium' CHECK (materiality IN ('low','medium','high')),
  derived_from_record_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  derived_from_fact_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  evidence TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('none','low','medium','high')),
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('fresh','attention','stale','review','unknown')),
  lifecycle_state TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_state IN ('active','review_required','blocked_by_gap','superseded')),
  action TEXT,
  entity_name TEXT,
  entity_type TEXT,
  insight_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, rule_id, entity_name)
);

ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS tenant_key TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS rule_id TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS so_what TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS materiality TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS derived_from_record_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS derived_from_fact_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS evidence TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS confidence TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS freshness_status TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS lifecycle_state TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS entity_name TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS insight_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE context_insights ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_context_insights_tenant_materiality
  ON context_insights (tenant_key, lifecycle_state, materiality, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_context_insights_tenant_rule_entity_unique
  ON context_insights (tenant_key, rule_id, entity_name);
CREATE INDEX IF NOT EXISTS idx_context_insights_rule
  ON context_insights (tenant_key, rule_id);
CREATE INDEX IF NOT EXISTS idx_context_insights_records_gin
  ON context_insights USING GIN (derived_from_record_ids);
CREATE INDEX IF NOT EXISTS idx_context_insights_facts_gin
  ON context_insights USING GIN (derived_from_fact_ids);

CREATE INDEX IF NOT EXISTS idx_significance_rules_enabled
  ON significance_rules (enabled, rule_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_significance_rules_rule_id_unique
  ON significance_rules (rule_id);

INSERT INTO significance_rules (
  rule_id,
  rule_key,
  domain,
  title,
  description,
  severity_floor,
  evaluator_key,
  required_record_types,
  metadata
) VALUES
  (
    'renewal-window-no-benchmark',
    'renewal-window-no-benchmark',
    'Vendor',
    'Near-term vendor renewal has commercial risk',
    'Flags vendor or license renewals due within the planning window where commercial risk is material.',
    'medium',
    'renewalWindowCommercialRisk',
    ARRAY['vendors_contracts_licenses'],
    '{"source":"context-insight-materializer","version":1}'::jsonb
  ),
  (
    'value-coverage-gap',
    'value-coverage-gap',
    'Cost',
    'Committed initiative spend lacks enough realized value proof',
    'Flags initiatives where promised benefit materially exceeds measured value or the evidence posture is incomplete.',
    'medium',
    'valueCoverageGap',
    ARRAY['initiatives_portfolio','ai_automation_footprint'],
    '{"source":"context-insight-materializer","version":1}'::jsonb
  ),
  (
    'critical-platform-drag',
    'critical-platform-drag',
    'Service',
    'Critical legacy platform is constraining transformation',
    'Flags critical applications with high run cost, integration gravity, and legacy or modernization pressure.',
    'medium',
    'criticalPlatformDrag',
    ARRAY['applications_systems'],
    '{"source":"context-insight-materializer","version":1}'::jsonb
  ),
  (
    'data-foundation-readiness-gap',
    'data-foundation-readiness-gap',
    'Data quality',
    'Data foundation gap blocks trusted analytics and automation',
    'Flags data assets where quality, freshness, semantic layer, or target platform readiness is not yet enough for reliable AI/analytics.',
    'medium',
    'dataFoundationReadinessGap',
    ARRAY['data_analytics_estate','integrations_interfaces'],
    '{"source":"context-insight-materializer","version":1}'::jsonb
  ),
  (
    'governed-ai-risk-gap',
    'governed-ai-risk-gap',
    'AI Value',
    'AI automation is ahead of governance evidence',
    'Flags AI assets or agents with high/regulated risk, incomplete approval, or missing evidence for the next gate.',
    'medium',
    'governedAiRiskGap',
    ARRAY['ai_automation_footprint','security_risk_compliance'],
    '{"source":"context-insight-materializer","version":1}'::jsonb
  ),
  (
    'operational-backlog-automation-pressure',
    'operational-backlog-automation-pressure',
    'Service',
    'Operational volume is creating automation pressure',
    'Flags services or processes with high monthly volume, backlog, MTTR, or repeated failure signals that should inform Moves and Tower priorities.',
    'medium',
    'operationalBacklogAutomationPressure',
    ARRAY['operations_service_management','platform_volumetrics'],
    '{"source":"context-insight-materializer","version":1}'::jsonb
  )
ON CONFLICT (rule_id) DO UPDATE SET
  rule_key = excluded.rule_key,
  domain = excluded.domain,
  title = excluded.title,
  description = excluded.description,
  enabled = true,
  severity_floor = excluded.severity_floor,
  evaluator_key = excluded.evaluator_key,
  required_record_types = excluded.required_record_types,
  metadata = significance_rules.metadata || excluded.metadata,
  updated_at = now();

ALTER TABLE significance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON significance_rules;
CREATE POLICY svc_all ON significance_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS auth_read ON significance_rules;
CREATE POLICY auth_read ON significance_rules FOR SELECT TO authenticated USING (true);
GRANT SELECT ON significance_rules TO authenticated;

DROP POLICY IF EXISTS svc_all ON context_insights;
CREATE POLICY svc_all ON context_insights FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS auth_read ON context_insights;
CREATE POLICY auth_read ON context_insights FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS auth_insert ON context_insights;
CREATE POLICY auth_insert ON context_insights FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS auth_update ON context_insights;
CREATE POLICY auth_update ON context_insights FOR UPDATE TO authenticated USING (can_write_tenant_by_key(tenant_key)) WITH CHECK (can_write_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS auth_delete ON context_insights;
CREATE POLICY auth_delete ON context_insights FOR DELETE TO authenticated USING (can_write_tenant_by_key(tenant_key));
GRANT SELECT, INSERT, UPDATE, DELETE ON context_insights TO authenticated;

COMMENT ON TABLE context_insights IS
  'Tenant-scoped L2 insights derived deterministically from enterprise_context_records/facts. Every active row should carry derived_from_record_ids and derived_from_fact_ids for evidence traceability.';
COMMENT ON TABLE significance_rules IS
  'Registry of deterministic context significance rules that materialize context_insights after data refreshes.';

NOTIFY pgrst, 'reload schema';

COMMIT;
