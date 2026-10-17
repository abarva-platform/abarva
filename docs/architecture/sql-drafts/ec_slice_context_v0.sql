-- Disposable-only rehearsal. Not an automatic production migration.
begin;
do $$ begin
  if current_database() <> 'ecl_admission_test' then
    raise exception 'Context slice draft requires disposable ecl_admission_test';
  end if;
end $$;

-- Unknown receipt time is not the current clock or a fabricated intake event.
alter table ecl_source.source_file alter column received_at drop not null;

alter table intelligence_v6.graph_nodes drop constraint if exists graph_nodes_materialized_from_check;
alter table intelligence_v6.graph_nodes add constraint graph_nodes_materialized_from_check
  check (materialized_from in ('v6_business_record','relationship_endpoint','manual_override','system_seed','ecl_context_object'));

do $$ declare definition text; begin
  select pg_get_constraintdef(oid) into definition from pg_constraint
    where conrelid = 'ecl_context.relationship'::regclass and conname = 'relationship_type_check';
  if position('''SUPPORTS''' in definition) = 0 then
    alter table ecl_context.relationship drop constraint relationship_type_check;
    execute 'alter table ecl_context.relationship add constraint relationship_type_check check (' ||
      substring(definition from 8 for length(definition) - 8) ||
      ' OR relationship_type in (''SUPPORTS'', ''USES''))';
  end if;
end $$;

-- Existing dictionary orientation wins; inverse traversal never inserts an edge.
insert into intelligence_v6.relationship_types
  (relationship_type, canonical_label, relationship_category, directionality,
   executive_safe, description)
select verb, lower(replace(verb, '_', ' ')), category, 'directed', false,
  'Declared context relation for isolated non-serving rehearsal.'
from (values
  ('HAS_SEGMENT', 'hierarchy'), ('HAS_FUNCTION', 'hierarchy'),
  ('BELONGS_TO_SEGMENT', 'hierarchy'), ('ACCOUNTABLE_TO', 'ownership'),
  ('MODULE_OF', 'hierarchy'), ('DEPLOYMENT_OF', 'infrastructure'),
  ('SUPPLIED_BY', 'vendor_system'), ('COVERED_BY', 'commercial'),
  ('ADVANCES_PRIORITY', 'transformation'), ('APPLIES_TO', 'risk_control'),
  ('WORKS_IN', 'ownership'), ('EVIDENCE_REQUESTED_FOR', 'evidence'),
  ('ATTRIBUTED_TO', 'ownership'), ('COST_OF', 'financial')
) as declarations(verb, category)
on conflict (relationship_type) do nothing;

update intelligence_v6.relationship_types dictionary set
  allowed_from_object_families = declaration.from_families,
  allowed_to_object_families = declaration.to_families
from (values
  ('HAS_SEGMENT', array['enterprise'], array['segment']),
  ('HAS_FUNCTION', array['enterprise'], array['function']),
  ('BELONGS_TO_SEGMENT', array['function','org_unit'], array['segment']),
  ('ACCOUNTABLE_TO', array['function','process','application','platform','program','initiative','service','risk','control','strategic_priority'], array['role']),
  ('SUPPORTS', array['application'], array['process']),
  ('MODULE_OF', array['application_module'], array['application']),
  ('DEPLOYMENT_OF', array['deployment'], array['application']),
  ('HOSTED_ON', array['deployment','data_asset','etl_job'], array['platform']),
  ('FEEDS', array['application','etl_job','data_asset'], array['data_asset']),
  ('SUPPLIED_BY', array['application','contract','service','ai_tool'], array['supplier']),
  ('COVERED_BY', array['application','service'], array['contract']),
  ('ADVANCES_PRIORITY', array['program','initiative'], array['strategic_priority']),
  ('APPLIES_TO', array['risk'], array['application','process','data_asset','service']),
  ('MITIGATES', array['control'], array['risk']),
  ('USES', array['ai_use_case'], array['ai_tool']),
  ('WORKS_IN', array['workforce_cohort'], array['function']),
  ('EVIDENCE_REQUESTED_FOR', array['evidence_request'], array['risk','control','program','initiative','metric_definition']),
  ('ATTRIBUTED_TO', array['leadership_observation'], array['role']),
  ('COST_OF', array['financial_line'], array['application','service']),
  ('MEASURES', array['metric_definition'], array['process'])
) as declaration(verb, from_families, to_families)
where dictionary.relationship_type = declaration.verb;

insert into ecl_context.object_type_catalog
  (object_type, display_label, grain, counting_class, description)
values
  ('capability', 'Capability', 'process', 'business_entity', 'Declared business capability, not an application or process count.'),
  ('initiative', 'Initiative', 'program', 'initiative', 'Declared deliverable, distinct from a program or string attribute.')
on conflict (object_type) do nothing;

do $$ declare definition text; begin
  select pg_get_constraintdef(oid) into definition from pg_constraint
    where conrelid = 'ecl_context.object'::regclass and conname = 'object_type_check';
  if position('capability' in definition) = 0 then
    alter table ecl_context.object drop constraint object_type_check;
    execute 'alter table ecl_context.object add constraint object_type_check check (' ||
      substring(definition from 8 for length(definition) - 8) ||
      ' OR object_type in (''capability'', ''initiative''))';
  end if;
end $$;

create table if not exists ecl_context.assertion (
  id uuid primary key,
  tenant_key text not null,
  assessment_id text not null,
  subject_id uuid not null,
  subject_kind text not null check (subject_kind in ('object','document','evidence_item')),
  subject_object_id uuid,
  semantic_key text not null,
  value_json jsonb,
  missing_reason text,
  source_record_id uuid not null,
  source_version text not null,
  source_locator_json jsonb not null check (source_locator_json <> '{}'::jsonb),
  valid_from timestamptz,
  valid_to timestamptz,
  known_at timestamptz not null,
  basis text not null,
  source_access_scope text not null default 'unknown' check (source_access_scope = 'unknown'),
  access_decision text not null default 'deny' check (access_decision = 'deny'),
  review_state text not null default 'not_reviewed' check (review_state = 'not_reviewed'),
  attributes_json jsonb not null default '{}'::jsonb,
  unique (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, subject_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  check ((subject_kind = 'object' and subject_object_id = subject_id) or
    (subject_kind <> 'object' and subject_object_id is null)),
  check (value_json is not null or missing_reason is not null),
  check (valid_to is null or valid_from is null or valid_to > valid_from)
);

alter table ecl_context.measure
  add column if not exists definition_version text,
  add column if not exists population_json jsonb,
  add column if not exists dimensions_json jsonb,
  add column if not exists calendar text,
  add column if not exists timezone text,
  add column if not exists method text,
  add column if not exists currency text,
  add column if not exists observation_role text,
  add column if not exists observation_key text;
-- A grain is indexed, not unique: competing source assertions must survive.
create index if not exists ec_slice_measure_grain on ecl_context.measure
  (tenant_key, assessment_id, metric_key, observation_key);

alter table ecl_context.relationship
  add column if not exists source_version text,
  add column if not exists valid_from timestamptz,
  add column if not exists valid_to timestamptz,
  add column if not exists known_at timestamptz,
  add column if not exists qualifiers_json jsonb not null default '{}'::jsonb;

create table if not exists ecl_context.rule_evaluation (
  id uuid primary key,
  tenant_key text not null,
  assessment_id text not null,
  rule_id text not null,
  rule_version text not null,
  implementation_hash text not null check (implementation_hash ~ '^[0-9a-f]{64}$'),
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  result_state text not null check (result_state in
    ('finding','clear','unknown','partial','conflicting','restricted','out_of_scope','not_comparable')),
  coverage_json jsonb not null,
  dependencies_json jsonb not null,
  result_json jsonb not null,
  review_state text not null default 'not_reviewed' check (review_state = 'not_reviewed'),
  agent_readiness_status text not null default 'blocked' check (agent_readiness_status = 'blocked'),
  downstream_context_policy text not null default 'exclude' check (downstream_context_policy = 'exclude'),
  unique (tenant_key, assessment_id, id)
);

alter table ecl_context.assertion enable row level security;
alter table ecl_context.rule_evaluation enable row level security;
drop policy if exists ec_slice_tenant on ecl_context.assertion;
create policy ec_slice_tenant on ecl_context.assertion for all
  using (tenant_key = current_setting('app.tenant_key', true))
  with check (tenant_key = current_setting('app.tenant_key', true));
drop policy if exists ec_slice_tenant on ecl_context.rule_evaluation;
create policy ec_slice_tenant on ecl_context.rule_evaluation for all
  using (tenant_key = current_setting('app.tenant_key', true))
  with check (tenant_key = current_setting('app.tenant_key', true));

-- Rehearse effective-role access without owner or BYPASSRLS privileges.
do $$ declare qualified text; begin
  foreach qualified in array array[
    'ecl_context.object','ecl_context.measure','ecl_context.relationship',
    'ecl_context.metric_definition','ecl_source.source_file',
    'ecl_source.source_record','ecl_source.document','ecl_source.document_extraction'
  ] loop
    execute 'alter table ' || qualified || ' enable row level security';
    execute 'drop policy if exists ec_slice_tenant_select on ' || qualified;
    execute 'create policy ec_slice_tenant_select on ' || qualified ||
      ' for select using (tenant_key = current_setting(''app.tenant_key'', true))';
  end loop;
end $$;
commit;
