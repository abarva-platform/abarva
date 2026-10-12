-- Derived candidates only. No active-product pointer, canonical writes or automatic admission.
begin;

create table ecl_projection.enterprise_insight_release (
  id uuid not null,
  tenant_key text not null,
  assessment_id text not null,
  dataset_id text not null,
  as_of date not null,
  source_set_hash text not null check (source_set_hash ~ '^[0-9a-f]{64}$'),
  rule_set_hash text not null check (rule_set_hash ~ '^[0-9a-f]{64}$'),
  result_hash text not null check (result_hash ~ '^[0-9a-f]{64}$'),
  load_version_hash text not null check (load_version_hash ~ '^[0-9a-f]{64}$'),
  expected_finding_count integer not null check (expected_finding_count >= 0),
  first_run_id text not null,
  release_record text not null,
  job_record_json jsonb not null,
  inventory_json jsonb not null,
  evaluations_json jsonb not null,
  review_state text not null default 'not_reviewed' check (review_state in ('not_reviewed','reviewed','rejected')),
  created_at timestamptz not null default now(),
  primary key (tenant_key, assessment_id, id),
  unique (tenant_key, assessment_id, source_set_hash, rule_set_hash)
);

create table ecl_projection.enterprise_insight_finding (
  id uuid not null,
  tenant_key text not null,
  assessment_id text not null,
  release_id uuid not null,
  rule_key text not null,
  finding_kind text not null check (finding_kind in ('record_finding','benchmark_comparison')),
  headline text not null,
  detail text not null,
  finding_hash text not null check (finding_hash ~ '^[0-9a-f]{64}$'),
  payload_json jsonb not null,
  governance_json jsonb not null,
  review_state text not null default 'not_reviewed' check (review_state in ('not_reviewed','reviewed','rejected')),
  agent_ready boolean not null default false check (agent_ready = false),
  search_document tsvector generated always as (to_tsvector('english', headline || ' ' || detail)) stored,
  created_at timestamptz not null default now(),
  primary key (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, release_id)
    references ecl_projection.enterprise_insight_release (tenant_key, assessment_id, id),
  check (governance_json @> jsonb_build_object('client_key', tenant_key,
    'agent_readiness_status', 'not_reviewed', 'id', id::text))
);

create table ecl_projection.enterprise_insight_object_ref (
  tenant_key text not null, assessment_id text not null, finding_id uuid not null, object_id uuid not null,
  primary key (tenant_key, assessment_id, finding_id, object_id),
  foreign key (tenant_key, assessment_id, finding_id) references ecl_projection.enterprise_insight_finding (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, object_id) references ecl_context.object (tenant_key, assessment_id, id)
);
create table ecl_projection.enterprise_insight_relationship_ref (
  tenant_key text not null, assessment_id text not null, finding_id uuid not null, relationship_id uuid not null,
  primary key (tenant_key, assessment_id, finding_id, relationship_id),
  foreign key (tenant_key, assessment_id, finding_id) references ecl_projection.enterprise_insight_finding (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, relationship_id) references ecl_context.relationship (tenant_key, assessment_id, id)
);
create table ecl_projection.enterprise_insight_measure_ref (
  tenant_key text not null, assessment_id text not null, finding_id uuid not null, measure_id uuid not null,
  primary key (tenant_key, assessment_id, finding_id, measure_id),
  foreign key (tenant_key, assessment_id, finding_id) references ecl_projection.enterprise_insight_finding (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, measure_id) references ecl_context.measure (tenant_key, assessment_id, id)
);
create table ecl_projection.enterprise_insight_source_ref (
  tenant_key text not null, assessment_id text not null, finding_id uuid not null, source_record_id uuid not null,
  primary key (tenant_key, assessment_id, finding_id, source_record_id),
  foreign key (tenant_key, assessment_id, finding_id) references ecl_projection.enterprise_insight_finding (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, source_record_id) references ecl_source.source_record (tenant_key, assessment_id, id)
);
create table ecl_projection.enterprise_insight_cube_ref (
  tenant_key text not null, assessment_id text not null, finding_id uuid not null, cube_slice_id uuid not null,
  primary key (tenant_key, assessment_id, finding_id, cube_slice_id),
  foreign key (tenant_key, assessment_id, finding_id) references ecl_projection.enterprise_insight_finding (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, cube_slice_id) references ecl_projection.cube_slice (tenant_key, assessment_id, id)
);

create index enterprise_insight_search_idx on ecl_projection.enterprise_insight_finding using gin(search_document);

do $$
declare table_name text;
begin
  foreach table_name in array array['enterprise_insight_release','enterprise_insight_finding',
    'enterprise_insight_object_ref','enterprise_insight_relationship_ref','enterprise_insight_measure_ref','enterprise_insight_source_ref','enterprise_insight_cube_ref']
  loop
    execute format('alter table ecl_projection.%I enable row level security', table_name);
    execute format('alter table ecl_projection.%I force row level security', table_name);
    execute format('create policy insight_tenant_fence on ecl_projection.%I for all
      using (tenant_key = current_setting(''app.tenant_key'', true))
      with check (tenant_key = current_setting(''app.tenant_key'', true))', table_name);
    execute format('revoke all on ecl_projection.%I from public', table_name);
  end loop;
end $$;

create view serving.enterprise_insight_candidates with (security_invoker = true) as
  select f.tenant_key, f.assessment_id, f.release_id, f.id, f.rule_key,
    f.finding_kind, f.headline, f.detail, f.review_state, f.agent_ready,
    f.payload_json, f.governance_json, r.as_of, r.source_set_hash, r.rule_set_hash, r.load_version_hash
  from ecl_projection.enterprise_insight_finding f
  join ecl_projection.enterprise_insight_release r
    on r.tenant_key=f.tenant_key and r.assessment_id=f.assessment_id and r.id=f.release_id
  where f.tenant_key=current_setting('app.tenant_key', true);
revoke all on serving.enterprise_insight_candidates from public;

commit;
