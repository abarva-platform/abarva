-- OPERATIONAL EVIDENCE DATA PLANE
-- Typed, tenant-scoped operational evidence substrate for process intelligence,
-- AI opportunity discovery, Moves readiness, and aVa cited answers.

BEGIN;

CREATE TABLE IF NOT EXISTS operational_evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('servicenow','jira','app_log','observability','cmdb','app_inventory','manual_upload','other')),
  connection_mode TEXT NOT NULL CHECK (connection_mode IN ('connector','export','upload','manual','synthetic_demo')),
  owner TEXT NOT NULL,
  steward_owner TEXT,
  data_classification TEXT NOT NULL DEFAULT 'Internal' CHECK (data_classification IN ('Public','Internal','Confidential','Restricted')),
  pii_phi_flag BOOLEAN NOT NULL DEFAULT false,
  retention_policy TEXT NOT NULL DEFAULT 'tenant_default',
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','active','paused','failed','retired')),
  last_ingested_at TIMESTAMPTZ,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, source_system, source_name)
);

CREATE TABLE IF NOT EXISTS operational_evidence_load_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_id UUID REFERENCES operational_evidence_sources(id) ON DELETE SET NULL,
  run_key TEXT NOT NULL,
  load_mode TEXT NOT NULL CHECK (load_mode IN ('connector','export','upload','manual','synthetic_demo')),
  state TEXT NOT NULL DEFAULT 'registered' CHECK (state IN (
    'registered','uploaded','staged','parsed','needs_mapping_review','needs_sensitivity_review',
    'needs_owner_attestation','reviewed','committed','indexed','retrieval_proven',
    'parse_failed','index_failed','rejected'
  )),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  template_version TEXT NOT NULL,
  parser_id TEXT NOT NULL,
  records_seen INTEGER NOT NULL DEFAULT 0 CHECK (records_seen >= 0),
  records_loaded INTEGER NOT NULL DEFAULT 0 CHECK (records_loaded >= 0),
  records_rejected INTEGER NOT NULL DEFAULT 0 CHECK (records_rejected >= 0),
  review_required_count INTEGER NOT NULL DEFAULT 0 CHECK (review_required_count >= 0),
  sensitivity_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_summary TEXT,
  load_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, run_key)
);

CREATE TABLE IF NOT EXISTS operational_evidence_file_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  load_run_id UUID REFERENCES operational_evidence_load_runs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES operational_evidence_sources(id) ON DELETE SET NULL,
  source_file TEXT NOT NULL,
  source_path TEXT,
  file_hash TEXT NOT NULL,
  mime_type TEXT,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  sheet_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  blob_uri TEXT NOT NULL,
  redaction_receipt_uri TEXT,
  uploaded_by TEXT,
  parser_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('uploaded','staged','parsed','review_required','committed','rejected')),
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, file_hash)
);

CREATE TABLE IF NOT EXISTS operational_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_id UUID REFERENCES operational_evidence_sources(id) ON DELETE SET NULL,
  load_run_id UUID REFERENCES operational_evidence_load_runs(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  work_item_type TEXT NOT NULL CHECK (work_item_type IN ('incident','request','change','problem','story','bug','epic','task')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  business_service TEXT,
  application_id TEXT,
  ci_id TEXT,
  category TEXT,
  subcategory TEXT,
  priority TEXT,
  severity TEXT,
  status TEXT NOT NULL,
  assignment_group TEXT,
  owner_team TEXT,
  assignee_role TEXT,
  opened_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  cycle_time_hours NUMERIC(12,2),
  reopen_count INTEGER NOT NULL DEFAULT 0 CHECK (reopen_count >= 0),
  handoff_count INTEGER NOT NULL DEFAULT 0 CHECK (handoff_count >= 0),
  sla_breached BOOLEAN NOT NULL DEFAULT false,
  linked_work_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  payload_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, external_id, work_item_type)
);

CREATE TABLE IF NOT EXISTS operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_id UUID REFERENCES operational_evidence_sources(id) ON DELETE SET NULL,
  load_run_id UUID REFERENCES operational_evidence_load_runs(id) ON DELETE SET NULL,
  event_time_bucket TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('error','alert','latency','api_failure','batch_failure','security_signal','performance','availability','other')),
  application_id TEXT,
  service_name TEXT,
  environment TEXT,
  severity TEXT,
  event_class TEXT,
  message_summary TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  frequency TEXT,
  latency_ms_avg NUMERIC(12,2),
  latency_ms_peak NUMERIC(12,2),
  linked_work_item_id TEXT,
  linked_change_id TEXT,
  owner_team TEXT,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_process_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  process_name TEXT NOT NULL,
  business_domain TEXT,
  start_event TEXT,
  end_event TEXT,
  process_step TEXT NOT NULL,
  system_of_record TEXT,
  owner_team TEXT,
  queue_or_status TEXT,
  average_wait_time_hours NUMERIC(12,2),
  average_work_time_hours NUMERIC(12,2),
  handoff_to TEXT,
  approval_required BOOLEAN NOT NULL DEFAULT false,
  rework_loop_flag BOOLEAN NOT NULL DEFAULT false,
  exception_flag BOOLEAN NOT NULL DEFAULT false,
  pain_point TEXT,
  automation_candidate BOOLEAN NOT NULL DEFAULT false,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_system_service_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  application_id TEXT NOT NULL,
  application_name TEXT NOT NULL,
  business_service TEXT,
  business_domain TEXT,
  technical_owner TEXT,
  business_owner TEXT,
  support_group TEXT,
  criticality TEXT,
  hosting_model TEXT,
  environment TEXT,
  technology_stack TEXT,
  upstream_dependencies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  downstream_dependencies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  regulatory_flag TEXT,
  lifecycle_status TEXT,
  incident_volume_12m INTEGER CHECK (incident_volume_12m IS NULL OR incident_volume_12m >= 0),
  change_volume_12m INTEGER CHECK (change_volume_12m IS NULL OR change_volume_12m >= 0),
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, application_id)
);

CREATE TABLE IF NOT EXISTS operational_automation_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  move_id UUID,
  opportunity_name TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  source_pattern TEXT NOT NULL,
  affected_process TEXT,
  affected_applications TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  affected_teams TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  current_pain TEXT NOT NULL,
  proposed_ai_capability TEXT NOT NULL,
  human_role TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  automation_level TEXT NOT NULL CHECK (automation_level IN ('assist','recommend','automate_with_approval','automate')),
  value_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  feasibility_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  readiness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  priority TEXT NOT NULL CHECK (priority IN ('P0','P1','P2','P3','P4')),
  required_controls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  pilot_candidate BOOLEAN NOT NULL DEFAULT false,
  ninety_day_fit TEXT,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_human_agent_responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  opportunity_id UUID REFERENCES operational_automation_opportunities(id) ON DELETE CASCADE,
  process_step TEXT NOT NULL,
  current_owner TEXT NOT NULL,
  future_human_role TEXT NOT NULL,
  future_agent_role TEXT NOT NULL,
  automation_level TEXT NOT NULL CHECK (automation_level IN ('assist','recommend','automate_with_approval','automate')),
  human_approval_required BOOLEAN NOT NULL DEFAULT true,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  evidence_required TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  guardrail TEXT NOT NULL,
  audit_requirement TEXT NOT NULL,
  estimate_impact TEXT,
  run_cost_impact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_value_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  opportunity_id UUID REFERENCES operational_automation_opportunities(id) ON DELETE CASCADE,
  value_driver TEXT NOT NULL,
  baseline_volume NUMERIC(14,2),
  baseline_effort_minutes NUMERIC(14,2),
  baseline_cycle_time TEXT,
  baseline_cost NUMERIC(14,2),
  target_reduction_percent NUMERIC(6,2),
  estimated_savings_low NUMERIC(14,2),
  estimated_savings_high NUMERIC(14,2),
  implementation_cost_low NUMERIC(14,2),
  implementation_cost_high NUMERIC(14,2),
  run_cost NUMERIC(14,2),
  payback_period TEXT,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  assumptions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  rate_card_source TEXT NOT NULL DEFAULT 'unknown',
  finance_validation_status TEXT NOT NULL DEFAULT 'required' CHECK (finance_validation_status IN ('not_started','required','in_review','validated','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_evidence_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  business_impact TEXT,
  recommended_action TEXT,
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_by_moves BOOLEAN NOT NULL DEFAULT false,
  source_snapshot_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_evidence_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  from_entity_type TEXT NOT NULL,
  from_entity_id TEXT NOT NULL,
  to_entity_type TEXT NOT NULL,
  to_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  evidence_strength NUMERIC(4,3) CHECK (evidence_strength IS NULL OR (evidence_strength >= 0 AND evidence_strength <= 1)),
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, from_entity_type, from_entity_id, to_entity_type, to_entity_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS operational_semantic_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  move_id UUID,
  snapshot_key TEXT NOT NULL,
  view_id TEXT NOT NULL,
  input_hashes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  freshness TEXT NOT NULL DEFAULT 'unknown',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  caveats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, snapshot_key)
);

CREATE TABLE IF NOT EXISTS move_evidence_slot_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  move_id UUID NOT NULL,
  phase TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  readiness_tier TEXT NOT NULL CHECK (readiness_tier IN ('minimum_draft','recommended_executive','optional_board')),
  status TEXT NOT NULL CHECK (status IN ('covered','partial','missing','blocked')),
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  caveats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  client_to_complete TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, move_id, phase, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_operational_sources_tenant_status ON operational_evidence_sources(tenant_key, status);
CREATE INDEX IF NOT EXISTS idx_operational_load_runs_tenant_state ON operational_evidence_load_runs(tenant_key, state, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_file_manifests_tenant_hash ON operational_evidence_file_manifests(tenant_key, file_hash);
CREATE INDEX IF NOT EXISTS idx_operational_work_items_source ON operational_work_items(tenant_key, source_id, external_id);
CREATE INDEX IF NOT EXISTS idx_operational_work_items_app ON operational_work_items(tenant_key, application_id);
CREATE INDEX IF NOT EXISTS idx_operational_work_items_opened ON operational_work_items(tenant_key, opened_at);
CREATE INDEX IF NOT EXISTS idx_operational_work_items_resolved ON operational_work_items(tenant_key, resolved_at);
CREATE INDEX IF NOT EXISTS idx_operational_events_app ON operational_events(tenant_key, application_id);
CREATE INDEX IF NOT EXISTS idx_operational_events_time ON operational_events(tenant_key, event_time_bucket);
CREATE INDEX IF NOT EXISTS idx_operational_process_name ON operational_process_observations(tenant_key, process_name);
CREATE INDEX IF NOT EXISTS idx_operational_service_maps_app ON operational_system_service_maps(tenant_key, application_id);
CREATE INDEX IF NOT EXISTS idx_operational_opportunities_move ON operational_automation_opportunities(tenant_key, move_id, priority);
CREATE INDEX IF NOT EXISTS idx_operational_value_estimates_opportunity ON operational_value_estimates(tenant_key, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_operational_relationships_type ON operational_evidence_relationships(tenant_key, relationship_type);
CREATE INDEX IF NOT EXISTS idx_operational_snapshots_view ON operational_semantic_snapshots(tenant_key, view_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_move_evidence_slot_coverage_move ON move_evidence_slot_coverage(tenant_key, move_id, phase);

CREATE INDEX IF NOT EXISTS idx_operational_work_items_evidence_refs ON operational_work_items USING GIN (evidence_refs);
CREATE INDEX IF NOT EXISTS idx_operational_opportunities_apps ON operational_automation_opportunities USING GIN (affected_applications);
CREATE INDEX IF NOT EXISTS idx_operational_opportunities_teams ON operational_automation_opportunities USING GIN (affected_teams);
CREATE INDEX IF NOT EXISTS idx_operational_opportunities_controls ON operational_automation_opportunities USING GIN (required_controls);
CREATE INDEX IF NOT EXISTS idx_move_evidence_slot_refs ON move_evidence_slot_coverage USING GIN (evidence_refs);

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'operational_evidence_sources',
    'operational_evidence_load_runs',
    'operational_evidence_file_manifests',
    'operational_work_items',
    'operational_events',
    'operational_process_observations',
    'operational_system_service_maps',
    'operational_automation_opportunities',
    'operational_human_agent_responsibilities',
    'operational_value_estimates',
    'operational_evidence_insights',
    'operational_evidence_relationships',
    'operational_semantic_snapshots',
    'move_evidence_slot_coverage'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS svc_all ON %I', tbl);
    EXECUTE format('CREATE POLICY svc_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_read ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_read ON %I FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_insert ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_insert ON %I FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_update ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_update ON %I FOR UPDATE TO authenticated USING (can_write_tenant_by_key(tenant_key)) WITH CHECK (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('DROP POLICY IF EXISTS auth_delete ON %I', tbl);
    EXECUTE format('CREATE POLICY auth_delete ON %I FOR DELETE TO authenticated USING (can_write_tenant_by_key(tenant_key))', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', tbl);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
