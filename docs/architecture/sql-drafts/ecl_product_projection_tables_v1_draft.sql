-- ECL product projection tables v1 draft.
-- Design artifact only. Do not run against lab, preprod, or production
-- without explicit migration authorization.
--
-- Requires ecl_physical_schema_v1_draft.sql.

create table if not exists ecl_projection.projection_entry (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_version integer not null,
  surface_key text not null,
  row_key text not null,
  row_type text not null,
  source_hash text not null,
  refs_content_hash text not null,
  refs_cache_json jsonb not null default '{}'::jsonb,
  display_cache_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint projection_entry_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint projection_entry_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint projection_entry_version_check check (projection_version > 0),
  constraint projection_entry_surface_check check (
    surface_key in (
      'home_enterprise_landscape',
      'source_contract_360',
      'source_vendor_360',
      'source_value_levers',
      'source_event_workspace',
      'tower_command_center',
      'intelligence_context_pack'
    )
  ),
  constraint projection_entry_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    surface_key,
    row_key
  ),
  constraint projection_entry_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_projection.projection_entry_object_ref (
  tenant_key text not null,
  assessment_id text not null,
  projection_entry_id uuid not null,
  object_id uuid not null,
  ref_role text not null,
  sort_order integer not null default 1,
  source_hash text not null,
  constraint projection_entry_object_ref_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint projection_entry_object_ref_object_fk foreign key (tenant_key, assessment_id, object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint projection_entry_object_ref_sort_check check (sort_order > 0),
  constraint projection_entry_object_ref_unique unique (tenant_key, assessment_id, projection_entry_id, object_id, ref_role)
);

create table if not exists ecl_projection.projection_entry_metric_ref (
  tenant_key text not null,
  assessment_id text not null,
  projection_entry_id uuid not null,
  metric_key text not null,
  ref_role text not null,
  sort_order integer not null default 1,
  source_hash text not null,
  constraint projection_entry_metric_ref_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint projection_entry_metric_ref_metric_fk foreign key (tenant_key, metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint projection_entry_metric_ref_sort_check check (sort_order > 0),
  constraint projection_entry_metric_ref_unique unique (tenant_key, assessment_id, projection_entry_id, metric_key, ref_role)
);

create table if not exists ecl_projection.projection_entry_measure_ref (
  tenant_key text not null,
  assessment_id text not null,
  projection_entry_id uuid not null,
  measure_id uuid not null,
  ref_role text not null,
  sort_order integer not null default 1,
  source_hash text not null,
  constraint projection_entry_measure_ref_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint projection_entry_measure_ref_measure_fk foreign key (tenant_key, assessment_id, measure_id)
    references ecl_context.measure (tenant_key, assessment_id, id),
  constraint projection_entry_measure_ref_sort_check check (sort_order > 0),
  constraint projection_entry_measure_ref_unique unique (tenant_key, assessment_id, projection_entry_id, measure_id, ref_role)
);

create table if not exists ecl_projection.projection_entry_relationship_ref (
  tenant_key text not null,
  assessment_id text not null,
  projection_entry_id uuid not null,
  relationship_id uuid not null,
  ref_role text not null,
  sort_order integer not null default 1,
  source_hash text not null,
  constraint projection_entry_relationship_ref_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint projection_entry_relationship_ref_relationship_fk foreign key (tenant_key, assessment_id, relationship_id)
    references ecl_context.relationship (tenant_key, assessment_id, id),
  constraint projection_entry_relationship_ref_sort_check check (sort_order > 0),
  constraint projection_entry_relationship_ref_unique unique (tenant_key, assessment_id, projection_entry_id, relationship_id, ref_role)
);

create table if not exists ecl_projection.projection_entry_source_record_ref (
  tenant_key text not null,
  assessment_id text not null,
  projection_entry_id uuid not null,
  source_record_id uuid not null,
  ref_role text not null,
  sort_order integer not null default 1,
  source_hash text not null,
  constraint projection_entry_source_record_ref_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint projection_entry_source_record_ref_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint projection_entry_source_record_ref_sort_check check (sort_order > 0),
  constraint projection_entry_source_record_ref_unique unique (tenant_key, assessment_id, projection_entry_id, source_record_id, ref_role)
);

create table if not exists ecl_projection.projection_entry_document_extraction_ref (
  tenant_key text not null,
  assessment_id text not null,
  projection_entry_id uuid not null,
  document_extraction_id uuid not null,
  ref_role text not null,
  sort_order integer not null default 1,
  source_hash text not null,
  constraint projection_entry_document_extraction_ref_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint projection_entry_document_extraction_ref_document_extraction_fk foreign key (tenant_key, assessment_id, document_extraction_id)
    references ecl_source.document_extraction (tenant_key, assessment_id, id),
  constraint projection_entry_document_extraction_ref_sort_check check (sort_order > 0),
  constraint projection_entry_document_extraction_ref_unique unique (tenant_key, assessment_id, projection_entry_id, document_extraction_id, ref_role)
);

create table if not exists ecl_projection.home_enterprise_landscape (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  page_key text not null,
  row_key text not null,
  section_key text not null,
  row_type text not null,
  title text not null,
  summary text,
  primary_object_id uuid,
  metric_keys_json jsonb not null default '[]'::jsonb,
  relationship_ids_json jsonb not null default '[]'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  basis_summary text not null,
  value_state text not null,
  quality_state text not null,
  admission_status text not null default 'not_applicable',
  admission_gate_key text,
  admission_result_json jsonb not null default '{}'::jsonb,
  gap_flags_json jsonb not null default '[]'::jsonb,
  display_payload_json jsonb not null default '{}'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint home_enterprise_landscape_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint home_enterprise_landscape_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint home_enterprise_landscape_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint home_enterprise_landscape_primary_object_fk foreign key (tenant_key, assessment_id, primary_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint home_enterprise_landscape_version_check check (projection_version > 0),
  constraint home_enterprise_landscape_page_check check (
    page_key in (
      'executive_brief',
      'our_business',
      'strategy_value_creation',
      'how_we_operate',
      'technology_data',
      'performance_value',
      'leadership_perspective',
      'what_needs_attention',
      'current_state_architecture',
      'current_state_data_flow',
      'what_has_been_loaded',
      'browse_the_record',
      'applications_systems',
      'vendor_contracts',
      'infrastructure_platforms',
      'data_assets_integrations'
    )
  ),
  constraint home_enterprise_landscape_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint home_enterprise_landscape_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint home_enterprise_landscape_admission_status_check check (
    admission_status in ('admitted', 'refused', 'not_applicable')
  ),
  constraint home_enterprise_landscape_refusal_payload_check check (
    (
      admission_status = 'refused'
      and admission_gate_key is not null
      and admission_result_json <> '{}'::jsonb
    )
    or (
      admission_status in ('admitted', 'not_applicable')
      and admission_gate_key is null
      and admission_result_json = '{}'::jsonb
    )
  ),
  constraint home_enterprise_landscape_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    page_key,
    row_key
  )
);

create table if not exists ecl_projection.source_contract_360 (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  row_key text not null,
  contract_id uuid not null,
  contract_object_id uuid not null,
  vendor_object_id uuid not null,
  contract_name text not null,
  vendor_name text not null,
  renewal_notice_date date,
  end_date date,
  annualized_value_usd numeric,
  total_contract_value_usd numeric,
  value_state text not null,
  quality_state text not null,
  service_lines_json jsonb not null default '[]'::jsonb,
  scope_json jsonb not null default '[]'::jsonb,
  spend_summary_json jsonb not null default '{}'::jsonb,
  sla_summary_json jsonb not null default '{}'::jsonb,
  document_proof_json jsonb not null default '[]'::jsonb,
  gap_flags_json jsonb not null default '[]'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint source_contract_360_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint source_contract_360_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint source_contract_360_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint source_contract_360_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint source_contract_360_contract_object_fk foreign key (tenant_key, assessment_id, contract_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_contract_360_vendor_object_fk foreign key (tenant_key, assessment_id, vendor_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_contract_360_version_check check (projection_version > 0),
  constraint source_contract_360_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint source_contract_360_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint source_contract_360_unknown_money_null_check check (
    value_state not in ('unknown', 'not_applicable')
    or (annualized_value_usd is null and total_contract_value_usd is null)
  ),
  constraint source_contract_360_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    row_key
  )
);

create table if not exists ecl_projection.source_vendor_360 (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  row_key text not null,
  vendor_object_id uuid not null,
  vendor_name text not null,
  contract_count integer not null,
  covered_object_count integer not null,
  annualized_spend_usd numeric,
  renewal_exposure_usd numeric,
  value_state text not null,
  quality_state text not null,
  contract_ids_json jsonb not null default '[]'::jsonb,
  covered_objects_json jsonb not null default '[]'::jsonb,
  spend_summary_json jsonb not null default '{}'::jsonb,
  sla_summary_json jsonb not null default '{}'::jsonb,
  risk_control_json jsonb not null default '[]'::jsonb,
  gap_flags_json jsonb not null default '[]'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint source_vendor_360_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint source_vendor_360_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint source_vendor_360_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint source_vendor_360_vendor_object_fk foreign key (tenant_key, assessment_id, vendor_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_vendor_360_version_check check (projection_version > 0),
  constraint source_vendor_360_counts_check check (
    contract_count >= 0 and covered_object_count >= 0
  ),
  constraint source_vendor_360_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint source_vendor_360_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint source_vendor_360_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    row_key
  )
);

create table if not exists ecl_projection.source_value_levers (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  row_key text not null,
  lever_type text not null,
  opportunity_type text not null,
  opportunity_title text not null,
  contract_id uuid not null,
  contract_object_id uuid not null,
  vendor_object_id uuid not null,
  primary_metric_key text not null,
  baseline_spend_usd numeric,
  addressable_spend_usd numeric,
  estimated_value_low_usd numeric,
  estimated_value_high_usd numeric,
  claimable_value_usd numeric not null default 0,
  blocked_value_usd numeric,
  value_gate_status text not null,
  value_gate_reason_code text not null,
  value_gate_reason_detail text not null,
  evidence_state text not null,
  confidence numeric,
  affected_scope_json jsonb not null default '[]'::jsonb,
  benchmark_context_json jsonb not null default '{}'::jsonb,
  protection_context_json jsonb not null default '{}'::jsonb,
  next_action_json jsonb not null default '{}'::jsonb,
  metric_keys_json jsonb not null default '[]'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  gap_flags_json jsonb not null default '[]'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint source_value_levers_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint source_value_levers_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint source_value_levers_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint source_value_levers_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint source_value_levers_contract_object_fk foreign key (tenant_key, assessment_id, contract_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_value_levers_vendor_object_fk foreign key (tenant_key, assessment_id, vendor_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_value_levers_primary_metric_fk foreign key (tenant_key, primary_metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint source_value_levers_version_check check (projection_version > 0),
  constraint source_value_levers_type_check check (
    lever_type in (
      'renewal_leverage',
      'rate_variance',
      'exit_economics',
      'shortfall_recovery',
      'sla_recovery',
      'scope_rationalization',
      'evidence_request'
    )
  ),
  constraint source_value_levers_opportunity_check check (
    opportunity_type in ('renegotiate', 'recover', 'compete', 'protect', 'evidence_request')
  ),
  constraint source_value_levers_gate_status_check check (
    value_gate_status in ('claimable', 'gated', 'blocked')
  ),
  constraint source_value_levers_evidence_state_check check (
    evidence_state in ('source_recorded', 'model_inferred', 'mixed', 'missing_review', 'not_available')
  ),
  constraint source_value_levers_confidence_check check (
    confidence is null or confidence between 0 and 1
  ),
  constraint source_value_levers_money_nonnegative_check check (
    coalesce(baseline_spend_usd, 0) >= 0
    and coalesce(addressable_spend_usd, 0) >= 0
    and coalesce(estimated_value_low_usd, 0) >= 0
    and coalesce(estimated_value_high_usd, 0) >= 0
    and coalesce(claimable_value_usd, 0) >= 0
    and coalesce(blocked_value_usd, 0) >= 0
    and coalesce(estimated_value_high_usd, 0) >= coalesce(estimated_value_low_usd, 0)
  ),
  constraint source_value_levers_claimable_gate_check check (
    (value_gate_status = 'claimable' and claimable_value_usd > 0)
    or (value_gate_status in ('gated', 'blocked') and claimable_value_usd = 0 and value_gate_reason_code is not null)
  ),
  constraint source_value_levers_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    row_key
  )
);

create table if not exists ecl_projection.source_event_workspace (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  row_key text not null,
  workspace_tab text not null,
  row_type text not null,
  event_key text not null,
  event_title text not null,
  contract_id uuid not null,
  contract_object_id uuid not null,
  vendor_object_id uuid not null,
  review_event_id uuid not null,
  event_stage text not null,
  event_status text not null,
  gate_status text not null,
  gate_reason_code text,
  gate_reason_detail text,
  owner_role text not null,
  due_date date,
  evidence_needed_json jsonb not null default '[]'::jsonb,
  decision_context_json jsonb not null default '{}'::jsonb,
  next_action_json jsonb not null default '{}'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  gap_flags_json jsonb not null default '[]'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint source_event_workspace_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint source_event_workspace_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint source_event_workspace_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint source_event_workspace_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint source_event_workspace_contract_object_fk foreign key (tenant_key, assessment_id, contract_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_event_workspace_vendor_object_fk foreign key (tenant_key, assessment_id, vendor_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint source_event_workspace_review_event_fk foreign key (tenant_key, assessment_id, review_event_id)
    references ecl_review.review_event (tenant_key, assessment_id, id),
  constraint source_event_workspace_version_check check (projection_version > 0),
  constraint source_event_workspace_tab_check check (
    workspace_tab in ('events', 'approvals', 'compare')
  ),
  constraint source_event_workspace_row_type_check check (
    row_type in ('sourcing_event', 'approval_gate', 'vendor_response_compare')
  ),
  constraint source_event_workspace_stage_check check (
    event_stage in ('intake', 'evidence_collection', 'owner_review', 'finance_review', 'legal_review', 'sourcing_decision')
  ),
  constraint source_event_workspace_status_check check (
    event_status in ('not_started', 'in_progress', 'blocked', 'ready_for_review', 'approved', 'rejected')
  ),
  constraint source_event_workspace_gate_status_check check (
    gate_status in ('open', 'gated', 'blocked')
  ),
  constraint source_event_workspace_gate_payload_check check (
    (
      gate_status = 'open'
      and gate_reason_code is null
      and coalesce(jsonb_array_length(evidence_needed_json), 0) = 0
    )
    or (
      gate_status in ('gated', 'blocked')
      and gate_reason_code is not null
      and gate_reason_detail is not null
      and coalesce(jsonb_array_length(evidence_needed_json), 0) > 0
    )
  ),
  constraint source_event_workspace_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    workspace_tab,
    row_key
  )
);

create table if not exists ecl_projection.tower_command_center (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  row_key text not null,
  page_key text not null,
  row_type text not null,
  primary_object_id uuid,
  claim_id text,
  claim_gate_status text not null default 'not_applicable',
  claim_gate_reason_code text,
  claim_gate_reason_detail text,
  next_gate text,
  evidence_needed_json jsonb not null default '[]'::jsonb,
  funded_amount_usd numeric,
  promised_value_usd numeric,
  usage_supported_value_usd numeric,
  finance_validated_value_usd numeric,
  claimable_value_usd numeric,
  blocked_value_usd numeric,
  proof_maturity_score integer,
  risk_pressure_score integer,
  usage_strength_score integer,
  owner_role text,
  handoff_module text,
  value_state text not null,
  quality_state text not null,
  metric_keys_json jsonb not null default '[]'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  gap_flags_json jsonb not null default '[]'::jsonb,
  display_payload_json jsonb not null default '{}'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint tower_command_center_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint tower_command_center_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint tower_command_center_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint tower_command_center_primary_object_fk foreign key (tenant_key, assessment_id, primary_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint tower_command_center_page_key_check check (
    page_key in (
      'command_center',
      'value_proof',
      'decision_lanes',
      'evidence',
      'recommended_actions',
      'ai_portfolio',
      'cost_lens',
      'risk_lens',
      'adoption_lens'
    )
  ),
  constraint tower_command_center_claim_gate_status_check check (
    claim_gate_status in ('claimable', 'gated', 'blocked', 'not_applicable')
  ),
  constraint tower_command_center_gate_reason_check check (
    (claim_gate_status in ('gated', 'blocked') and claim_gate_reason_code is not null)
    or claim_gate_status in ('claimable', 'not_applicable')
  ),
  constraint tower_command_center_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint tower_command_center_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint tower_command_center_scores_check check (
    (proof_maturity_score is null or proof_maturity_score between 0 and 100)
    and (risk_pressure_score is null or risk_pressure_score between 0 and 100)
    and (usage_strength_score is null or usage_strength_score between 0 and 100)
  ),
  constraint tower_command_center_money_nonnegative_check check (
    coalesce(funded_amount_usd, 0) >= 0
    and coalesce(promised_value_usd, 0) >= 0
    and coalesce(usage_supported_value_usd, 0) >= 0
    and coalesce(finance_validated_value_usd, 0) >= 0
    and coalesce(claimable_value_usd, 0) >= 0
    and coalesce(blocked_value_usd, 0) >= 0
  ),
  constraint tower_command_center_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    page_key,
    row_key
  )
);

create table if not exists ecl_projection.intelligence_context_pack (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  context_pack_id uuid not null,
  projection_manifest_id uuid not null,
  projection_entry_id uuid not null,
  projection_version integer not null,
  row_key text not null,
  surface_key text not null,
  primary_object_id uuid,
  prompt_context_json jsonb not null default '{}'::jsonb,
  permitted_facts_json jsonb not null default '[]'::jsonb,
  blocked_facts_json jsonb not null default '[]'::jsonb,
  citation_refs_json jsonb not null default '[]'::jsonb,
  retrieval_state text not null,
  value_state text not null,
  quality_state text not null,
  access_class text not null,
  gap_flags_json jsonb not null default '[]'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint intelligence_context_pack_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint intelligence_context_pack_context_pack_fk foreign key (tenant_key, assessment_id, context_pack_id)
    references ecl_context.context_pack (tenant_key, assessment_id, id),
  constraint intelligence_context_pack_manifest_fk foreign key (projection_manifest_id)
    references ecl_projection.projection_manifest (id),
  constraint intelligence_context_pack_entry_fk foreign key (tenant_key, assessment_id, projection_entry_id)
    references ecl_projection.projection_entry (tenant_key, assessment_id, id),
  constraint intelligence_context_pack_primary_object_fk foreign key (tenant_key, assessment_id, primary_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint intelligence_context_pack_retrieval_state_check check (
    retrieval_state in ('not_indexed', 'indexed', 'retrieved', 'cited', 'blocked')
  ),
  constraint intelligence_context_pack_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint intelligence_context_pack_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint intelligence_context_pack_access_class_check check (
    access_class in ('public_demo', 'internal', 'client_confidential', 'restricted')
  ),
  constraint intelligence_context_pack_unique unique (
    tenant_key,
    assessment_id,
    projection_version,
    surface_key,
    row_key
  )
);

create index if not exists idx_home_enterprise_landscape_page
  on ecl_projection.home_enterprise_landscape (tenant_key, assessment_id, projection_version, page_key);
create index if not exists idx_projection_entry_surface
  on ecl_projection.projection_entry (tenant_key, assessment_id, projection_version, surface_key);
create index if not exists idx_projection_entry_object_ref_object
  on ecl_projection.projection_entry_object_ref (tenant_key, assessment_id, object_id);
create index if not exists idx_projection_entry_metric_ref_metric
  on ecl_projection.projection_entry_metric_ref (tenant_key, metric_key);
create index if not exists idx_projection_entry_measure_ref_measure
  on ecl_projection.projection_entry_measure_ref (tenant_key, assessment_id, measure_id);
create index if not exists idx_projection_entry_relationship_ref_relationship
  on ecl_projection.projection_entry_relationship_ref (tenant_key, assessment_id, relationship_id);
create index if not exists idx_projection_entry_source_record_ref_source_record
  on ecl_projection.projection_entry_source_record_ref (tenant_key, assessment_id, source_record_id);
create index if not exists idx_projection_entry_document_extraction_ref_document_extraction
  on ecl_projection.projection_entry_document_extraction_ref (tenant_key, assessment_id, document_extraction_id);
create index if not exists idx_home_enterprise_landscape_admission
  on ecl_projection.home_enterprise_landscape (tenant_key, assessment_id, admission_status, admission_gate_key);
create index if not exists idx_source_contract_360_contract
  on ecl_projection.source_contract_360 (tenant_key, assessment_id, contract_id);
create index if not exists idx_source_contract_360_vendor
  on ecl_projection.source_contract_360 (tenant_key, assessment_id, vendor_object_id);
create index if not exists idx_source_vendor_360_vendor
  on ecl_projection.source_vendor_360 (tenant_key, assessment_id, vendor_object_id);
create index if not exists idx_source_value_levers_contract
  on ecl_projection.source_value_levers (tenant_key, assessment_id, contract_id);
create index if not exists idx_source_value_levers_gate
  on ecl_projection.source_value_levers (tenant_key, assessment_id, value_gate_status, value_gate_reason_code);
create index if not exists idx_source_value_levers_metric
  on ecl_projection.source_value_levers (tenant_key, primary_metric_key);
create index if not exists idx_source_event_workspace_tab
  on ecl_projection.source_event_workspace (tenant_key, assessment_id, projection_version, workspace_tab);
create index if not exists idx_source_event_workspace_contract
  on ecl_projection.source_event_workspace (tenant_key, assessment_id, contract_id);
create index if not exists idx_source_event_workspace_gate
  on ecl_projection.source_event_workspace (tenant_key, assessment_id, gate_status, gate_reason_code);
create index if not exists idx_tower_command_center_page
  on ecl_projection.tower_command_center (tenant_key, assessment_id, projection_version, page_key);
create index if not exists idx_tower_command_center_gate
  on ecl_projection.tower_command_center (tenant_key, assessment_id, claim_gate_status, claim_gate_reason_code);
create index if not exists idx_intelligence_context_pack_surface
  on ecl_projection.intelligence_context_pack (tenant_key, assessment_id, projection_version, surface_key);
create index if not exists idx_intelligence_context_pack_retrieval
  on ecl_projection.intelligence_context_pack (tenant_key, assessment_id, retrieval_state);

alter table ecl_projection.home_enterprise_landscape enable row level security;
alter table ecl_projection.projection_entry enable row level security;
alter table ecl_projection.projection_entry_object_ref enable row level security;
alter table ecl_projection.projection_entry_metric_ref enable row level security;
alter table ecl_projection.projection_entry_measure_ref enable row level security;
alter table ecl_projection.projection_entry_relationship_ref enable row level security;
alter table ecl_projection.projection_entry_source_record_ref enable row level security;
alter table ecl_projection.projection_entry_document_extraction_ref enable row level security;
alter table ecl_projection.source_contract_360 enable row level security;
alter table ecl_projection.source_vendor_360 enable row level security;
alter table ecl_projection.source_value_levers enable row level security;
alter table ecl_projection.source_event_workspace enable row level security;
alter table ecl_projection.tower_command_center enable row level security;
alter table ecl_projection.intelligence_context_pack enable row level security;
