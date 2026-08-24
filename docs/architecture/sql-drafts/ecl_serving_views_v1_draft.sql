-- ECL serving views v1 draft.
-- Design artifact only. Do not run against lab, preprod, or production
-- without explicit migration authorization.
--
-- Requires ecl_physical_schema_v1_draft.sql and ecl_product_projection_tables_v1_draft.sql.

create schema if not exists serving;

create table if not exists serving.serving_contract (
  surface_key text primary key,
  product text not null,
  serving_view text not null unique,
  ecl_backing text not null,
  build_state text not null,
  owner_person text not null,
  due_date date not null,
  proof_state text not null default 'not_proven',
  browser_proof_state text not null default 'not_run',
  cutover_state text not null default 'not_cut_over',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint serving_contract_product_check check (
    product in ('Home', 'Tower', 'Source', 'Intelligence')
  ),
  constraint serving_contract_state_check check (
    build_state in ('backing_built', 'serving_built', 'not_built')
  ),
  constraint serving_contract_proof_state_check check (
    proof_state in ('not_proven', 'local_proven', 'azure_readback_proven', 'browser_proven')
  ),
  constraint serving_contract_browser_state_check check (
    browser_proof_state in ('not_run', 'passed', 'failed', 'blocked')
  ),
  constraint serving_contract_cutover_state_check check (
    cutover_state in ('not_cut_over', 'shadow', 'default', 'rolled_back')
  ),
  constraint serving_contract_view_check check (serving_view ~ '^serving\.[a-z0-9_]+$'),
  constraint serving_contract_backing_check check (ecl_backing ~ '^ecl_projection\.[a-z0-9_]+$')
);

insert into serving.serving_contract (
  surface_key,
  product,
  serving_view,
  ecl_backing,
  build_state,
  owner_person,
  due_date,
  proof_state
)
values
  ('home_executive_brief', 'Home', 'serving.home_executive_brief', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_our_business', 'Home', 'serving.home_our_business', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_strategy_value_creation', 'Home', 'serving.home_strategy_value_creation', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_how_we_operate', 'Home', 'serving.home_how_we_operate', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_technology_data', 'Home', 'serving.home_technology_data', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_performance_value', 'Home', 'serving.home_performance_value', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_leadership_perspective', 'Home', 'serving.home_leadership_perspective', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_needs_attention', 'Home', 'serving.home_needs_attention', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_current_state_architecture', 'Home', 'serving.home_current_state_architecture', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_current_state_data_flow', 'Home', 'serving.home_current_state_data_flow', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_loaded_record', 'Home', 'serving.home_loaded_record', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_browse_record', 'Home', 'serving.home_browse_record', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_applications_systems', 'Home', 'serving.home_applications_systems', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_vendor_contracts', 'Home', 'serving.home_vendor_contracts', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_infrastructure_platforms', 'Home', 'serving.home_infrastructure_platforms', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('home_data_assets_integrations', 'Home', 'serving.home_data_assets_integrations', 'ecl_projection.home_enterprise_landscape', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_command_center', 'Tower', 'serving.tower_command_center', 'ecl_projection.tower_command_center', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_value_proof', 'Tower', 'serving.tower_value_proof', 'ecl_projection.tower_value_chain', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_decision_lanes', 'Tower', 'serving.tower_decision_lanes', 'ecl_projection.tower_value_chain', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_evidence', 'Tower', 'serving.tower_evidence', 'ecl_projection.tower_evidence_queue', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_recommended_actions', 'Tower', 'serving.tower_recommended_actions', 'ecl_projection.tower_evidence_queue', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_ai_portfolio', 'Tower', 'serving.tower_ai_portfolio', 'ecl_projection.tower_ai_portfolio', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_cost_lens', 'Tower', 'serving.tower_cost_lens', 'ecl_projection.tower_value_chain', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_risk_lens', 'Tower', 'serving.tower_risk_lens', 'ecl_projection.tower_evidence_queue', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('tower_adoption_lens', 'Tower', 'serving.tower_adoption_lens', 'ecl_projection.tower_ai_portfolio', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_vendor_portfolio', 'Source', 'serving.source_vendor_portfolio', 'ecl_projection.source_vendor_360', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_vendor_360', 'Source', 'serving.source_vendor_360', 'ecl_projection.source_vendor_360', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_contract_360', 'Source', 'serving.source_contract_360', 'ecl_projection.source_contract_360', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_renewal', 'Source', 'serving.source_renewal', 'ecl_projection.source_contract_360', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_events', 'Source', 'serving.source_events', 'ecl_projection.source_event_workspace', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_compare', 'Source', 'serving.source_compare', 'ecl_projection.source_event_workspace', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_value', 'Source', 'serving.source_value', 'ecl_projection.source_value_levers', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_approvals', 'Source', 'serving.source_approvals', 'ecl_projection.source_event_workspace', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('source_sourcing_opportunities', 'Source', 'serving.source_sourcing_opportunities', 'ecl_projection.source_value_levers', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('intelligence_advisory', 'Intelligence', 'serving.intelligence_advisory', 'ecl_projection.intelligence_context_pack', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('intelligence_enterprise_landscape', 'Intelligence', 'serving.intelligence_enterprise_landscape', 'ecl_projection.intelligence_context_pack', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('intelligence_ask_query', 'Intelligence', 'serving.intelligence_ask_query', 'ecl_projection.intelligence_question_context', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('intelligence_insights_evaluate', 'Intelligence', 'serving.intelligence_insights_evaluate', 'ecl_projection.intelligence_pattern_evidence', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('intelligence_pattern_detail', 'Intelligence', 'serving.intelligence_pattern_detail', 'ecl_projection.intelligence_pattern_evidence', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven'),
  ('intelligence_context_summary', 'Intelligence', 'serving.intelligence_context_summary', 'ecl_projection.intelligence_context_pack', 'serving_built', 'internal-ecl-serving-owner', '2026-08-25', 'local_proven')
on conflict (surface_key) do update set
  product = excluded.product,
  serving_view = excluded.serving_view,
  ecl_backing = excluded.ecl_backing,
  build_state = excluded.build_state,
  owner_person = excluded.owner_person,
  due_date = excluded.due_date,
  proof_state = excluded.proof_state,
  updated_at = now();

create or replace function serving.home_surface_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Home'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    p.basis_summary,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    p.admission_status,
    p.admission_gate_key,
    p.admission_result_json,
    p.id,
    p.page_key,
    p.row_key,
    p.row_type,
    p.title,
    p.summary,
    p.primary_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.home_enterprise_landscape p
  where p.page_key = page_key_arg;
$$;

create or replace function serving.tower_command_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Tower'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.page_key,
    p.row_key,
    p.row_type,
    coalesce(p.claim_id, p.row_key),
    p.claim_gate_reason_detail,
    p.primary_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.tower_command_center p
  where page_key_arg = 'all' or p.page_key = page_key_arg;
$$;

create or replace function serving.tower_value_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Tower'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    p.evidence_state,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.page_key,
    p.row_key,
    p.row_type,
    p.claim_id,
    p.claim_gate_reason_detail,
    p.primary_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.tower_value_chain p
  where page_key_arg = 'all' or p.page_key = page_key_arg;
$$;

create or replace function serving.tower_evidence_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Tower'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    p.evidence_state,
    'known'::text,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.page_key,
    p.row_key,
    p.row_type,
    p.claim_id,
    p.claim_gate_reason_detail,
    p.primary_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.tower_evidence_queue p
  where p.page_key = page_key_arg;
$$;

create or replace function serving.tower_ai_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Tower'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    p.review_state,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    'ai_usage_observation'::text,
    p.use_case_name,
    p.tool_name,
    p.use_case_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.tower_ai_portfolio p;
$$;

create or replace function serving.source_vendor_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    'vendor'::text,
    p.vendor_name,
    p.contract_count::text || ' contracts',
    p.vendor_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_vendor_360 p;
$$;

create or replace function serving.source_contract_rows(surface_key_arg text, page_key_arg text, renewal_only_arg boolean)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'source_recorded'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    'contract'::text,
    p.contract_name,
    p.vendor_name,
    p.contract_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_contract_360 p
  where not renewal_only_arg
    or p.end_date is not null
    or p.renewal_notice_date is not null;
$$;

create or replace function serving.source_event_rows(surface_key_arg text, page_key_arg text, workspace_tab_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'review_event'::text,
    'known'::text,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    p.row_type,
    p.event_title,
    p.gate_reason_detail,
    p.contract_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_event_workspace p
  where workspace_tab_arg = 'all' or p.workspace_tab = workspace_tab_arg;
$$;

create or replace function serving.source_value_rows(surface_key_arg text, page_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Source'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    p.evidence_state,
    'estimated'::text,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    page_key_arg,
    p.row_key,
    p.lever_type,
    p.opportunity_title,
    p.value_gate_reason_detail,
    p.contract_object_id,
    p.source_refs_json,
    to_jsonb(p)
  from ecl_projection.source_value_levers p;
$$;

create or replace function serving.intelligence_context_rows(surface_key_arg text, context_surface_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Intelligence'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'context_pack'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.surface_key,
    p.row_key,
    'context_pack'::text,
    p.surface_key,
    p.retrieval_state,
    p.primary_object_id,
    p.citation_refs_json,
    to_jsonb(p)
  from ecl_projection.intelligence_context_pack p
  where p.surface_key = context_surface_arg;
$$;

create or replace function serving.intelligence_question_rows(surface_key_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Intelligence'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'context_pack'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    p.gap_flags_json,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.surface_key,
    p.row_key,
    'question_context'::text,
    p.question_text,
    p.retrieval_state,
    p.primary_object_id,
    p.citation_refs_json,
    to_jsonb(p)
  from ecl_projection.intelligence_question_context p;
$$;

create or replace function serving.intelligence_pattern_rows(surface_key_arg text, pattern_surface_arg text)
returns table (
  surface_key text,
  product text,
  tenant_key text,
  assessment_id text,
  snapshot_id uuid,
  projection_manifest_id uuid,
  projection_entry_id uuid,
  projection_version integer,
  source_hash text,
  basis text,
  value_state text,
  review_state text,
  origin text,
  gap_flags_json jsonb,
  admission_status text,
  admission_gate_key text,
  admission_result_json jsonb,
  projection_row_id uuid,
  page_key text,
  row_key text,
  row_type text,
  title text,
  summary text,
  primary_object_id uuid,
  source_refs_json jsonb,
  payload_json jsonb
)
language sql
stable
as $$
  select
    surface_key_arg,
    'Intelligence'::text,
    p.tenant_key,
    p.assessment_id,
    p.snapshot_id,
    p.projection_manifest_id,
    p.projection_entry_id,
    p.projection_version,
    p.source_hash,
    'pattern_evidence'::text,
    p.value_state,
    'not_reviewed'::text,
    'synthetic_generator'::text,
    '[]'::jsonb,
    'not_applicable'::text,
    null::text,
    '{}'::jsonb,
    p.id,
    p.surface_key,
    p.row_key,
    p.pattern_key,
    p.pattern_claim,
    p.conflict_state,
    p.primary_object_id,
    p.citation_refs_json,
    to_jsonb(p)
  from ecl_projection.intelligence_pattern_evidence p
  where p.surface_key = pattern_surface_arg;
$$;

create or replace view serving.home_executive_brief as
select * from serving.home_surface_rows('home_executive_brief', 'executive_brief');
create or replace view serving.home_our_business as
select * from serving.home_surface_rows('home_our_business', 'our_business');
create or replace view serving.home_strategy_value_creation as
select * from serving.home_surface_rows('home_strategy_value_creation', 'strategy_value_creation');
create or replace view serving.home_how_we_operate as
select * from serving.home_surface_rows('home_how_we_operate', 'how_we_operate');
create or replace view serving.home_technology_data as
select * from serving.home_surface_rows('home_technology_data', 'technology_data');
create or replace view serving.home_performance_value as
select * from serving.home_surface_rows('home_performance_value', 'performance_value');
create or replace view serving.home_leadership_perspective as
select * from serving.home_surface_rows('home_leadership_perspective', 'leadership_perspective');
create or replace view serving.home_needs_attention as
select * from serving.home_surface_rows('home_needs_attention', 'what_needs_attention');
create or replace view serving.home_current_state_architecture as
select * from serving.home_surface_rows('home_current_state_architecture', 'current_state_architecture');
create or replace view serving.home_current_state_data_flow as
select * from serving.home_surface_rows('home_current_state_data_flow', 'current_state_data_flow');
create or replace view serving.home_loaded_record as
select * from serving.home_surface_rows('home_loaded_record', 'what_has_been_loaded');
create or replace view serving.home_browse_record as
select * from serving.home_surface_rows('home_browse_record', 'browse_the_record');
create or replace view serving.home_applications_systems as
select * from serving.home_surface_rows('home_applications_systems', 'applications_systems');
create or replace view serving.home_vendor_contracts as
select * from serving.home_surface_rows('home_vendor_contracts', 'vendor_contracts');
create or replace view serving.home_infrastructure_platforms as
select * from serving.home_surface_rows('home_infrastructure_platforms', 'infrastructure_platforms');
create or replace view serving.home_data_assets_integrations as
select * from serving.home_surface_rows('home_data_assets_integrations', 'data_assets_integrations');

create or replace view serving.tower_command_center as
select * from serving.tower_command_rows('tower_command_center', 'all');
create or replace view serving.tower_value_proof as
select * from serving.tower_value_rows('tower_value_proof', 'all');
create or replace view serving.tower_decision_lanes as
select * from serving.tower_command_rows('tower_decision_lanes', 'decision_lanes');
create or replace view serving.tower_evidence as
select * from serving.tower_evidence_rows('tower_evidence', 'evidence');
create or replace view serving.tower_recommended_actions as
select * from serving.tower_command_rows('tower_recommended_actions', 'recommended_actions');
create or replace view serving.tower_ai_portfolio as
select * from serving.tower_ai_rows('tower_ai_portfolio', 'ai_portfolio');
create or replace view serving.tower_cost_lens as
select * from serving.tower_value_rows('tower_cost_lens', 'cost_lens');
create or replace view serving.tower_risk_lens as
select * from serving.tower_evidence_rows('tower_risk_lens', 'risk_lens');
create or replace view serving.tower_adoption_lens as
select * from serving.tower_ai_rows('tower_adoption_lens', 'adoption_lens');

create or replace view serving.source_vendor_portfolio as
select * from serving.source_vendor_rows('source_vendor_portfolio', 'vendor_portfolio');
create or replace view serving.source_vendor_360 as
select * from serving.source_vendor_rows('source_vendor_360', 'vendor_360');
create or replace view serving.source_contract_360 as
select * from serving.source_contract_rows('source_contract_360', 'contract_360', false);
create or replace view serving.source_renewal as
select * from serving.source_contract_rows('source_renewal', 'renewal', true);
create or replace view serving.source_events as
select * from serving.source_event_rows('source_events', 'events', 'events');
create or replace view serving.source_compare as
select * from serving.source_event_rows('source_compare', 'compare', 'all');
create or replace view serving.source_value as
select * from serving.source_value_rows('source_value', 'value');
create or replace view serving.source_approvals as
select * from serving.source_event_rows('source_approvals', 'approvals', 'all');
create or replace view serving.source_sourcing_opportunities as
select * from serving.source_value_rows('source_sourcing_opportunities', 'sourcing_opportunities');

create or replace view serving.intelligence_advisory as
select * from serving.intelligence_context_rows('intelligence_advisory', 'advisory_page');
create or replace view serving.intelligence_enterprise_landscape as
select * from serving.intelligence_context_rows('intelligence_enterprise_landscape', 'enterprise_landscape');
create or replace view serving.intelligence_ask_query as
select * from serving.intelligence_question_rows('intelligence_ask_query');
create or replace view serving.intelligence_insights_evaluate as
select * from serving.intelligence_pattern_rows('intelligence_insights_evaluate', 'insights_evaluate');
create or replace view serving.intelligence_pattern_detail as
select * from serving.intelligence_pattern_rows('intelligence_pattern_detail', 'pattern_detail');
create or replace view serving.intelligence_context_summary as
select * from serving.intelligence_context_rows('intelligence_context_summary', 'context_summary');
