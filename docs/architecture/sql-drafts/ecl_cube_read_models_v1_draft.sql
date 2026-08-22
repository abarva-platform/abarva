-- ECL cube/read-model tables v1 draft.
-- Design artifact only. Do not run against lab, preprod, or production
-- without explicit migration authorization.
--
-- Requires ecl_physical_schema_v1_draft.sql.

create table if not exists ecl_projection.cube_manifest (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  cube_key text not null,
  cube_version integer not null,
  rebuild_command text not null,
  source_hash text not null,
  cube_hash text not null,
  slice_count integer not null,
  quality_state text not null,
  admission_status text not null default 'not_applicable',
  admission_gate_results_json jsonb not null default '[]'::jsonb,
  proof_uri text not null,
  created_at timestamptz not null default now(),
  constraint cube_manifest_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint cube_manifest_key_check check (
    cube_key in (
      'home_coverage_cube',
      'architecture_cube',
      'data_analytics_cube',
      'source_vendor_cube',
      'source_contract_cube',
      'tower_spend_value_cube',
      'tower_evidence_cube',
      'ai_portfolio_cube',
      'intelligence_citation_cube'
    )
  ),
  constraint cube_manifest_version_check check (cube_version > 0),
  constraint cube_manifest_slice_count_check check (slice_count >= 0),
  constraint cube_manifest_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint cube_manifest_admission_status_check check (
    admission_status in ('admitted', 'refused', 'not_applicable')
  ),
  constraint cube_manifest_admission_payload_check check (
    (
      admission_status = 'refused'
      and admission_gate_results_json <> '[]'::jsonb
    )
    or (
      admission_status in ('admitted', 'not_applicable')
      and admission_gate_results_json = '[]'::jsonb
    )
  ),
  constraint cube_manifest_unique unique (tenant_key, assessment_id, cube_key, cube_version),
  constraint cube_manifest_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_projection.cube_slice (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  cube_manifest_id uuid not null,
  cube_key text not null,
  cube_version integer not null,
  slice_key text not null,
  grain_key text not null,
  primary_object_id uuid,
  dimensions_json jsonb not null,
  measures_json jsonb not null,
  primary_metric_key text not null,
  metric_keys_json jsonb not null default '[]'::jsonb,
  source_refs_json jsonb not null default '[]'::jsonb,
  basis_summary text not null,
  value_state text not null,
  quality_state text not null,
  gap_flags_json jsonb not null default '[]'::jsonb,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint cube_slice_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint cube_slice_manifest_fk foreign key (tenant_key, assessment_id, cube_manifest_id)
    references ecl_projection.cube_manifest (tenant_key, assessment_id, id),
  constraint cube_slice_primary_object_fk foreign key (tenant_key, assessment_id, primary_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint cube_slice_primary_metric_fk foreign key (tenant_key, primary_metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint cube_slice_key_check check (
    cube_key in (
      'home_coverage_cube',
      'architecture_cube',
      'data_analytics_cube',
      'source_vendor_cube',
      'source_contract_cube',
      'tower_spend_value_cube',
      'tower_evidence_cube',
      'ai_portfolio_cube',
      'intelligence_citation_cube'
    )
  ),
  constraint cube_slice_version_check check (cube_version > 0),
  constraint cube_slice_dimensions_not_empty_check check (dimensions_json <> '{}'::jsonb),
  constraint cube_slice_measures_not_empty_check check (measures_json <> '{}'::jsonb),
  constraint cube_slice_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint cube_slice_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint cube_slice_blocked_has_gap_check check (
    quality_state <> 'blocked' or gap_flags_json <> '[]'::jsonb
  ),
  constraint cube_slice_unique unique (
    tenant_key,
    assessment_id,
    cube_key,
    cube_version,
    slice_key
  ),
  constraint cube_slice_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_projection.cube_slice_metric (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  cube_slice_id uuid not null,
  metric_key text not null,
  metric_role text not null,
  unit text,
  sort_order integer not null default 0,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint cube_slice_metric_slice_fk foreign key (tenant_key, assessment_id, cube_slice_id)
    references ecl_projection.cube_slice (tenant_key, assessment_id, id),
  constraint cube_slice_metric_definition_fk foreign key (tenant_key, metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint cube_slice_metric_role_check check (
    metric_role in ('primary', 'display', 'filter', 'supporting')
  ),
  constraint cube_slice_metric_sort_order_check check (sort_order >= 0),
  constraint cube_slice_metric_unique unique (
    tenant_key,
    assessment_id,
    cube_slice_id,
    metric_key,
    metric_role
  )
);

create table if not exists ecl_projection.cube_slice_measure (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  cube_slice_id uuid not null,
  measure_id uuid not null,
  metric_key text not null,
  measure_role text not null,
  source_hash text not null,
  created_at timestamptz not null default now(),
  constraint cube_slice_measure_slice_fk foreign key (tenant_key, assessment_id, cube_slice_id)
    references ecl_projection.cube_slice (tenant_key, assessment_id, id),
  constraint cube_slice_measure_measure_fk foreign key (tenant_key, assessment_id, measure_id)
    references ecl_context.measure (tenant_key, assessment_id, id),
  constraint cube_slice_measure_metric_definition_fk foreign key (tenant_key, metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint cube_slice_measure_role_check check (
    measure_role in ('primary', 'display', 'filter', 'supporting')
  ),
  constraint cube_slice_measure_unique unique (
    tenant_key,
    assessment_id,
    cube_slice_id,
    measure_id,
    measure_role
  )
);

create index if not exists idx_cube_manifest_key_version
  on ecl_projection.cube_manifest (tenant_key, assessment_id, cube_key, cube_version desc);
create index if not exists idx_cube_slice_key_grain
  on ecl_projection.cube_slice (tenant_key, assessment_id, cube_key, cube_version, grain_key);
create index if not exists idx_cube_slice_primary_object
  on ecl_projection.cube_slice (tenant_key, assessment_id, primary_object_id);
create index if not exists idx_cube_slice_dimensions_gin
  on ecl_projection.cube_slice using gin (dimensions_json);
create index if not exists idx_cube_slice_measures_gin
  on ecl_projection.cube_slice using gin (measures_json);
create index if not exists idx_cube_slice_metric_key
  on ecl_projection.cube_slice_metric (tenant_key, assessment_id, metric_key);
create index if not exists idx_cube_slice_measure_metric
  on ecl_projection.cube_slice_measure (tenant_key, assessment_id, metric_key);
create index if not exists idx_cube_slice_measure_id
  on ecl_projection.cube_slice_measure (tenant_key, assessment_id, measure_id);

alter table ecl_projection.cube_manifest enable row level security;
alter table ecl_projection.cube_slice enable row level security;
alter table ecl_projection.cube_slice_metric enable row level security;
alter table ecl_projection.cube_slice_measure enable row level security;
