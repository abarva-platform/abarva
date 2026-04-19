-- AbarVa AI Value Office
-- Core objects for agent-led use case design, value contracts, evidence mapping,
-- and recommendation history.

CREATE TABLE IF NOT EXISTS value_office_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  submitted_idea TEXT NOT NULL,
  business_problem TEXT,
  why_now TEXT,
  use_case_type TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'explore', 'recommended', 'ready_for_review', 'approved', 'pilot', 'hold', 'redesign', 'scaled', 'rejected', 'stopped')),
  recommendation TEXT,
  recommendation_summary TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  sponsor_name TEXT,
  sponsor_role TEXT,
  owner_name TEXT,
  target_users TEXT,
  workflow_summary TEXT,
  value_hypothesis TEXT,
  solution_pattern JSONB NOT NULL DEFAULT '{}',
  readiness JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_use_cases_client_id
  ON value_office_use_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_value_office_use_cases_status
  ON value_office_use_cases(status);
CREATE INDEX IF NOT EXISTS idx_value_office_use_cases_created_at
  ON value_office_use_cases(created_at DESC);

CREATE TABLE IF NOT EXISTS value_office_value_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES value_office_use_cases(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  where_value_lost TEXT,
  target_state TEXT,
  baseline_metric TEXT,
  baseline_value TEXT,
  target_metric TEXT,
  target_value TEXT,
  unit TEXT,
  evidence_source TEXT,
  evidence_owner TEXT,
  review_cadence TEXT,
  confidence_grade TEXT,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_value_contracts_use_case
  ON value_office_value_contracts(use_case_id, display_order);

CREATE TABLE IF NOT EXISTS value_office_evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES value_office_use_cases(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT,
  integration_mode TEXT,
  status TEXT NOT NULL DEFAULT 'needed'
    CHECK (status IN ('needed', 'identified', 'available', 'connected', 'proxy_only')),
  system_name TEXT,
  owner_name TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_evidence_sources_use_case
  ON value_office_evidence_sources(use_case_id);

CREATE TABLE IF NOT EXISTS value_office_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES value_office_use_cases(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  summary TEXT,
  rationale TEXT,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  risks TEXT[] NOT NULL DEFAULT '{}',
  missing_data TEXT[] NOT NULL DEFAULT '{}',
  next_actions TEXT[] NOT NULL DEFAULT '{}',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  model_used TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_recommendations_use_case
  ON value_office_recommendations(use_case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS value_office_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID REFERENCES value_office_use_cases(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_conversations_use_case
  ON value_office_conversations(use_case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_value_office_conversations_client
  ON value_office_conversations(client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS value_office_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES value_office_use_cases(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  rationale TEXT,
  decided_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_decisions_use_case
  ON value_office_decisions(use_case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS value_office_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES value_office_use_cases(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value TEXT,
  unit TEXT,
  confidence_grade TEXT,
  notes TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_office_metric_snapshots_use_case
  ON value_office_metric_snapshots(use_case_id, captured_at DESC);

ALTER TABLE value_office_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_office_value_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_office_evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_office_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_office_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_office_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_office_metric_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "value_office_use_cases_service_role_all"
  ON value_office_use_cases FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "value_office_value_contracts_service_role_all"
  ON value_office_value_contracts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "value_office_evidence_sources_service_role_all"
  ON value_office_evidence_sources FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "value_office_recommendations_service_role_all"
  ON value_office_recommendations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "value_office_conversations_service_role_all"
  ON value_office_conversations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "value_office_decisions_service_role_all"
  ON value_office_decisions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "value_office_metric_snapshots_service_role_all"
  ON value_office_metric_snapshots FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
