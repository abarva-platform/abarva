-- migration:destructive-allowed
BEGIN;

DO $$ BEGIN
  CREATE TYPE app_time_classification AS ENUM ('tolerate', 'invest', 'migrate', 'eliminate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE org_topology_type AS ENUM ('stream', 'platform', 'enabling', 'complicated_subsystem');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE role_inventory_source AS ENUM ('fte', 'contractor', 'si', 'gcc');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discovery_instrument_status AS ENUM ('not_started', 'in_progress', 'blocked', 'complete', 'waived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE move_dependency_relation_type AS ENUM ('depends_on', 'triggers', 'informs', 'blocks');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE value_state_layer_type AS ENUM (
    'adoption',
    'dora_delta',
    'hours_saved',
    'hours_reallocated',
    'license_dollars',
    'realized_value_usd',
    'process_changes_shipped',
    'kill_criteria_status'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kill_criterion_status AS ENUM ('not_evaluated', 'pass', 'watch', 'fail', 'waived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_register_status AS ENUM ('open', 'mitigating', 'accepted', 'closed', 'triggered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE infra_ms_tower AS ENUM ('network', 'datacenter', 'cloud_ops', 'security_ops', 'aiops', 'finops');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS vendor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  contract_category TEXT NOT NULL,
  scope_summary TEXT,
  owner_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  annual_contract_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (annual_contract_value_usd >= 0),
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  ai_usage_clauses BOOLEAN NOT NULL DEFAULT false,
  indemnity_provided BOOLEAN NOT NULL DEFAULT false,
  exit_terms_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  concentration_pct NUMERIC(5,2) CHECK (concentration_pct IS NULL OR (concentration_pct >= 0 AND concentration_pct <= 100)),
  rate_card_vintage DATE,
  outcome_based BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, vendor_id)
);

ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_id TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS vendor_name TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS contract_name TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS contract_category TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS scope_summary TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES persons(id) ON DELETE SET NULL;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS annual_contract_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS ai_usage_clauses BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS indemnity_provided BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS exit_terms_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS concentration_pct NUMERIC(5,2);
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS rate_card_vintage DATE;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS outcome_based BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_contracts_client_vendor_id
  ON vendor_contracts(client_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_client_active
  ON vendor_contracts(client_id, contract_category)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS application_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  name TEXT NOT NULL,
  stack TEXT NOT NULL,
  language TEXT NOT NULL,
  is_modern BOOLEAN NOT NULL,
  change_rate_per_yr INTEGER NOT NULL CHECK (change_rate_per_yr >= 0),
  fte_count NUMERIC(8,2) NOT NULL CHECK (fte_count >= 0),
  criticality_tier SMALLINT NOT NULL CHECK (criticality_tier BETWEEN 1 AND 4),
  time_classification app_time_classification NOT NULL,
  annual_run_cost_usd NUMERIC(14,2) NOT NULL CHECK (annual_run_cost_usd >= 0),
  ams_vendor_id TEXT,
  ams_contract_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (ams_contract_value_usd >= 0),
  sunset_decision_date DATE,
  ai_fit_score NUMERIC(5,2) CHECK (ai_fit_score IS NULL OR (ai_fit_score >= 0 AND ai_fit_score <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, app_id),
  FOREIGN KEY (client_id, ams_vendor_id)
    REFERENCES vendor_contracts(client_id, vendor_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_application_portfolio_client_time
  ON application_portfolio(client_id, time_classification)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_application_portfolio_client_modern
  ON application_portfolio(client_id, is_modern)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS org_topology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type org_topology_type NOT NULL,
  size_fte NUMERIC(8,2) NOT NULL CHECK (size_fte >= 0),
  span_of_control SMALLINT CHECK (span_of_control IS NULL OR span_of_control >= 0),
  geo TEXT NOT NULL,
  owning_apps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  maturity_stage SMALLINT NOT NULL CHECK (maturity_stage BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_org_topology_client_type
  ON org_topology(client_id, type)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS roles_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  title TEXT NOT NULL,
  fte_count NUMERIC(8,2) NOT NULL CHECK (fte_count >= 0),
  source role_inventory_source NOT NULL,
  geo TEXT NOT NULL,
  ladder_level TEXT NOT NULL,
  function_area TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_inventory_client_function
  ON roles_inventory(client_id, function_area, source)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS dora_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  app_id TEXT,
  measured_at TIMESTAMPTZ NOT NULL,
  deploy_freq_per_week NUMERIC(8,2) NOT NULL CHECK (deploy_freq_per_week >= 0),
  lead_time_hours NUMERIC(10,2) NOT NULL CHECK (lead_time_hours >= 0),
  mttr_hours NUMERIC(10,2) NOT NULL CHECK (mttr_hours >= 0),
  change_failure_rate_pct NUMERIC(5,2) NOT NULL CHECK (change_failure_rate_pct >= 0 AND change_failure_rate_pct <= 100),
  reliability_pct NUMERIC(5,2) NOT NULL CHECK (reliability_pct >= 0 AND reliability_pct <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, team_id, app_id, measured_at),
  FOREIGN KEY (client_id, team_id) REFERENCES org_topology(client_id, team_id) ON DELETE CASCADE,
  FOREIGN KEY (client_id, app_id) REFERENCES application_portfolio(client_id, app_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dora_baselines_client_measured
  ON dora_baselines(client_id, measured_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS space_devex_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  surveyed_at TIMESTAMPTZ NOT NULL,
  responses_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  n_responses INTEGER NOT NULL CHECK (n_responses >= 0),
  satisfaction_score NUMERIC(5,2) NOT NULL CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  performance_score NUMERIC(5,2) NOT NULL CHECK (performance_score >= 0 AND performance_score <= 100),
  activity_score NUMERIC(5,2) NOT NULL CHECK (activity_score >= 0 AND activity_score <= 100),
  collab_score NUMERIC(5,2) NOT NULL CHECK (collab_score >= 0 AND collab_score <= 100),
  efficiency_score NUMERIC(5,2) NOT NULL CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, team_id, surveyed_at),
  FOREIGN KEY (client_id, team_id) REFERENCES org_topology(client_id, team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_tool_footprint (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  licensed_seats INTEGER NOT NULL CHECK (licensed_seats >= 0),
  activated_seats INTEGER NOT NULL CHECK (activated_seats >= 0),
  dau INTEGER NOT NULL CHECK (dau >= 0),
  mau INTEGER NOT NULL CHECK (mau >= 0),
  annual_cost_usd NUMERIC(14,2) NOT NULL CHECK (annual_cost_usd >= 0),
  contract_end_date DATE,
  indemnity_status TEXT NOT NULL,
  retention_policy TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  CHECK (activated_seats <= licensed_seats),
  CHECK (dau <= activated_seats),
  CHECK (mau <= activated_seats),
  CHECK (dau <= mau),
  UNIQUE (client_id, tool_name, vendor)
);

CREATE TABLE IF NOT EXISTS infra_ms_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contract_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  service_tower infra_ms_tower NOT NULL,
  scope_summary TEXT NOT NULL,
  annual_contract_value_usd NUMERIC(14,2) NOT NULL CHECK (annual_contract_value_usd >= 0),
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  owner_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  aiops_coverage_pct NUMERIC(5,2) CHECK (aiops_coverage_pct IS NULL OR (aiops_coverage_pct >= 0 AND aiops_coverage_pct <= 100)),
  outcome_based BOOLEAN NOT NULL DEFAULT false,
  concentration_pct NUMERIC(5,2) CHECK (concentration_pct IS NULL OR (concentration_pct >= 0 AND concentration_pct <= 100)),
  exit_terms_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, contract_id)
);

CREATE INDEX IF NOT EXISTS idx_infra_ms_contracts_client_tower
  ON infra_ms_contracts(client_id, service_tower)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS discovery_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  move_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  instrument_template_id UUID NOT NULL,
  status discovery_instrument_status NOT NULL DEFAULT 'not_started',
  owner_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  due_date DATE,
  completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  evidence_link TEXT,
  t_tier SMALLINT NOT NULL CHECK (t_tier BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, move_id, instrument_template_id)
);

CREATE INDEX IF NOT EXISTS idx_discovery_instruments_client_status
  ON discovery_instruments(client_id, status, due_date)
  WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF to_regclass('public.instrument_templates') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'discovery_instruments_instrument_template_id_fkey'
         AND conrelid = 'discovery_instruments'::regclass
     ) THEN
    ALTER TABLE discovery_instruments
      ADD CONSTRAINT discovery_instruments_instrument_template_id_fkey
      FOREIGN KEY (instrument_template_id)
      REFERENCES instrument_templates(id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS move_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  from_move_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  to_move_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  relation_type move_dependency_relation_type NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  CHECK (from_move_id <> to_move_id),
  UNIQUE (client_id, from_move_id, to_move_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_move_dependencies_client_from
  ON move_dependencies(client_id, from_move_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_move_dependencies_client_to
  ON move_dependencies(client_id, to_move_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS value_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  move_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  layer_type value_state_layer_type NOT NULL,
  projected_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  tracked_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  attested_by UUID REFERENCES persons(id) ON DELETE SET NULL,
  attested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, move_id, layer_type)
);

CREATE TABLE IF NOT EXISTS kill_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  move_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES gate_criteria(id) ON DELETE SET NULL,
  criterion_name TEXT NOT NULL,
  threshold_numeric NUMERIC(14,4) NOT NULL,
  current_value NUMERIC(14,4),
  status kill_criterion_status NOT NULL DEFAULT 'not_evaluated',
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, move_id, criterion_name)
);

CREATE INDEX IF NOT EXISTS idx_kill_criteria_client_status
  ON kill_criteria(client_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS risk_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  move_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  impact SMALLINT NOT NULL CHECK (impact BETWEEN 1 AND 5),
  likelihood SMALLINT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  owner_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  mitigation TEXT NOT NULL,
  trigger_condition TEXT,
  status risk_register_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, move_id, name)
);

CREATE INDEX IF NOT EXISTS idx_risk_register_client_status
  ON risk_register(client_id, status, impact DESC, likelihood DESC)
  WHERE deleted_at IS NULL;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'vendor_contracts',
    'application_portfolio',
    'org_topology',
    'roles_inventory',
    'dora_baselines',
    'space_devex_surveys',
    'ai_tool_footprint',
    'infra_ms_contracts',
    'discovery_instruments',
    'move_dependencies',
    'value_states',
    'kill_criteria',
    'risk_register'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'service_role_all_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'service_role_all_' || table_name,
      table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'authenticated_read_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (deleted_at IS NULL AND can_read_tenant_by_id(client_id))',
      'authenticated_read_' || table_name,
      table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'authenticated_insert_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_id(client_id))',
      'authenticated_insert_' || table_name,
      table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'authenticated_update_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (deleted_at IS NULL AND can_write_tenant_by_id(client_id)) WITH CHECK (can_write_tenant_by_id(client_id))',
      'authenticated_update_' || table_name,
      table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'block_authenticated_delete_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (false)',
      'block_authenticated_delete_' || table_name,
      table_name,
      table_name
    );

    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON %I TO authenticated', table_name);

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', table_name || '_updated_at_trigger', table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      table_name || '_updated_at_trigger',
      table_name,
      table_name
    );
  END LOOP;
END
$$;

DROP TABLE IF EXISTS
  data_segment_ai_transformation,
  data_segment_compliance,
  data_segment_cross_program_signals,
  data_segment_decision_traces,
  data_segment_enterprise_profile,
  data_segment_evidence_ledger,
  data_segment_financial_model,
  data_segment_graph_relationships,
  data_segment_industry_context,
  data_segment_it_financials,
  data_segment_it_landscape,
  data_segment_kpi_dictionary,
  data_segment_kpi_history,
  data_segment_operating_telemetry,
  data_segment_org_structure,
  data_segment_peer_benchmarks,
  data_segment_program_deliverables,
  data_segment_program_inventory,
  data_segment_scenario_library,
  data_segment_sourcing_artifacts,
  data_segment_stakeholder_notes,
  data_segment_vendor_contracts,
  data_segment_vendor_intelligence,
  data_inventory_records,
  data_inventory_segments,
  tenant_expected_baselines,
  enterprise_graph_edges,
  enterprise_graph_nodes,
  enterprise_context_chunk_queue,
  enterprise_context_evidence,
  enterprise_context_facts,
  enterprise_context_quality_issues,
  enterprise_context_relationships,
  enterprise_context_records,
  enterprise_context_source_files,
  enterprise_context_sources,
  enterprise_context_stewardship_tasks,
  enterprise_context_snapshots,
  enterprise_context_template_runs,
  enterprise_context_chunks,
  data_inventory_audit_log,
  data_ingestion_runs
CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
