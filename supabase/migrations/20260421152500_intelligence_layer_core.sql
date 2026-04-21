-- Intelligence layer north star · core schema
-- Keystone is the first full reference implementation.

BEGIN;

CREATE TABLE IF NOT EXISTS access_scopes (
  id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  scope_type TEXT NOT NULL DEFAULT 'broad'
    CHECK (scope_type IN ('broad','program','role','maestro','regulatory_restricted')),
  program_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  role_filter TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  maestro_filter TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  output_mode_filter TEXT NOT NULL DEFAULT 'both'
    CHECK (output_mode_filter IN ('chat_only','artifacts_only','both','reasoning_only')),
  regulatory_constraints TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  audit_required BOOLEAN NOT NULL DEFAULT true,
  expiry_date DATE,
  scope_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_scopes_client ON access_scopes(client_id);
CREATE INDEX IF NOT EXISTS idx_access_scopes_type ON access_scopes(scope_type);

DROP TRIGGER IF EXISTS access_scopes_set_updated_at ON access_scopes;
CREATE TRIGGER access_scopes_set_updated_at BEFORE UPDATE ON access_scopes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS benchmark_cohorts (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  subsector TEXT,
  size_band TEXT,
  geography TEXT,
  business_model TEXT,
  maturity TEXT,
  peer_count INT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  peer_companies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  methodology_notes TEXT,
  source_id TEXT,
  as_of_date DATE,
  confidence_level TEXT,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_cohorts_client ON benchmark_cohorts(client_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_cohorts_sector ON benchmark_cohorts(sector, subsector);

DROP TRIGGER IF EXISTS benchmark_cohorts_set_updated_at ON benchmark_cohorts;
CREATE TRIGGER benchmark_cohorts_set_updated_at BEFORE UPDATE ON benchmark_cohorts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS external_sources (
  id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_tier TEXT NOT NULL,
  source_type TEXT NOT NULL,
  publisher TEXT,
  source_url TEXT,
  geography_scope TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  topic_scope TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_id TEXT,
  as_of_date DATE,
  confidence_level TEXT,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_sources_client ON external_sources(client_id);
CREATE INDEX IF NOT EXISTS idx_external_sources_tier ON external_sources(source_tier, source_type);

DROP TRIGGER IF EXISTS external_sources_set_updated_at ON external_sources;
CREATE TRIGGER external_sources_set_updated_at BEFORE UPDATE ON external_sources
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS external_events (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE,
  entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  geography TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  significance TEXT,
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  as_of_date DATE,
  confidence_level TEXT,
  last_verified_at TIMESTAMPTZ,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_events_client_date ON external_events(client_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_external_events_type ON external_events(event_type);

DROP TRIGGER IF EXISTS external_events_set_updated_at ON external_events;
CREATE TRIGGER external_events_set_updated_at BEFORE UPDATE ON external_events
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  related_entity_type TEXT NOT NULL,
  related_entity_id TEXT NOT NULL,
  observed_at DATE,
  methodology_notes TEXT,
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  as_of_date DATE,
  confidence_level TEXT,
  last_verified_at TIMESTAMPTZ,
  evidence_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_client_entity ON evidence(client_id, related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_observed_at ON evidence(observed_at DESC);

DROP TRIGGER IF EXISTS evidence_set_updated_at ON evidence;
CREATE TRIGGER evidence_set_updated_at BEFORE UPDATE ON evidence
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS kpis (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ordinal_ref TEXT,
  name TEXT NOT NULL,
  short_name TEXT,
  definition TEXT,
  category TEXT,
  subcategory TEXT,
  sector_applicability TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  owner_role_title TEXT,
  owner_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  owner_person_name TEXT,
  business_unit_name TEXT,
  strategic_priority_ref TEXT,
  target_value NUMERIC(14,2),
  target_unit TEXT,
  target_as_of_date DATE,
  target_period TEXT,
  current_value NUMERIC(14,2),
  current_unit TEXT,
  current_as_of_date DATE,
  trend_direction TEXT,
  trend_magnitude_pct NUMERIC(10,2),
  trend_period TEXT,
  trend_summary TEXT,
  benchmark_median NUMERIC(14,2),
  benchmark_top_quartile NUMERIC(14,2),
  benchmark_bottom_quartile NUMERIC(14,2),
  benchmark_peer_cohort_id TEXT REFERENCES benchmark_cohorts(id) ON DELETE SET NULL,
  benchmark_as_of_date DATE,
  benchmark_confidence TEXT,
  gap_to_median_pct NUMERIC(10,2),
  gap_to_top_quartile_pct NUMERIC(10,2),
  peer_position_quartile TEXT,
  linked_initiative_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  linked_pattern_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  upstream_kpi_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  downstream_kpi_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  conflicting_kpi_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  data_source TEXT,
  data_source_type TEXT,
  freshness_sla TEXT,
  last_refresh_timestamp TIMESTAMPTZ,
  confidence_level TEXT,
  why_it_matters TEXT,
  methodology_notes TEXT,
  common_objections JSONB NOT NULL DEFAULT '[]'::jsonb,
  known_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  source_id TEXT,
  as_of_date DATE,
  last_verified_at TIMESTAMPTZ,
  evidence_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  raw_markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpis_client ON kpis(client_id);
CREATE INDEX IF NOT EXISTS idx_kpis_category ON kpis(client_id, category, subcategory);
CREATE INDEX IF NOT EXISTS idx_kpis_owner ON kpis(owner_person_name, owner_role_title);

DROP TRIGGER IF EXISTS kpis_set_updated_at ON kpis;
CREATE TRIGGER kpis_set_updated_at BEFORE UPDATE ON kpis
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS pattern_packs (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ordinal_ref TEXT,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  category TEXT,
  sector_applicability TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cross_industry BOOLEAN NOT NULL DEFAULT false,
  variant_of TEXT,
  trigger_symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  detection_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnostic_questions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  likely_root_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_adjacent_contradictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  benchmark_signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  intervention_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  anti_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_failure_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
  phase_1_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_2_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_3_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_4_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expected_time_to_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  success_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  leading_indicators TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  required_sponsor_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  typical_stakeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_objections JSONB NOT NULL DEFAULT '[]'::jsonb,
  applicable_company_scales TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cross_pattern_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_kpi_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence_summary TEXT,
  confidence_level TEXT,
  last_updated DATE,
  version TEXT,
  author TEXT,
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  source_id TEXT,
  as_of_date DATE,
  last_verified_at TIMESTAMPTZ,
  raw_markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pattern_packs_client ON pattern_packs(client_id);
CREATE INDEX IF NOT EXISTS idx_pattern_packs_category ON pattern_packs(client_id, category);

DROP TRIGGER IF EXISTS pattern_packs_set_updated_at ON pattern_packs;
CREATE TRIGGER pattern_packs_set_updated_at BEFORE UPDATE ON pattern_packs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS telemetry_sources (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  modality TEXT NOT NULL,
  connector_type TEXT,
  source_location TEXT,
  credentials_reference TEXT,
  refresh_schedule TEXT,
  kpi_ids_populated TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  scope_description TEXT,
  data_format TEXT,
  residency_mode TEXT,
  retention_policy TEXT,
  compliance_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  regulatory_notes TEXT,
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  onboarded_at TIMESTAMPTZ,
  onboarded_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  program_association TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  sunset_policy TEXT,
  access_log_reference TEXT,
  last_accessed_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  source_id TEXT,
  as_of_date DATE,
  confidence_level TEXT,
  last_verified_at TIMESTAMPTZ,
  raw_markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_sources_client ON telemetry_sources(client_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_sources_modality ON telemetry_sources(client_id, modality);

DROP TRIGGER IF EXISTS telemetry_sources_set_updated_at ON telemetry_sources;
CREATE TRIGGER telemetry_sources_set_updated_at BEFORE UPDATE ON telemetry_sources
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE access_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_access_scopes" ON access_scopes;
CREATE POLICY "service_role_all_access_scopes" ON access_scopes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_benchmark_cohorts" ON benchmark_cohorts;
CREATE POLICY "service_role_all_benchmark_cohorts" ON benchmark_cohorts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_external_sources" ON external_sources;
CREATE POLICY "service_role_all_external_sources" ON external_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_external_events" ON external_events;
CREATE POLICY "service_role_all_external_events" ON external_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_evidence" ON evidence;
CREATE POLICY "service_role_all_evidence" ON evidence
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_kpis" ON kpis;
CREATE POLICY "service_role_all_kpis" ON kpis
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_pattern_packs" ON pattern_packs;
CREATE POLICY "service_role_all_pattern_packs" ON pattern_packs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_telemetry_sources" ON telemetry_sources;
CREATE POLICY "service_role_all_telemetry_sources" ON telemetry_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
