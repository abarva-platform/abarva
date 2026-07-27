\set ON_ERROR_STOP on

do $$
begin
  if current_database() <> 'abarva_hc_demo_new_knowledge_spike' then
    raise exception 'wrong database target: %', current_database();
  end if;
end $$;

create schema if not exists source_registry;
create schema if not exists evidence;
create schema if not exists working;
create schema if not exists knowledge;
create schema if not exists metrics;
create schema if not exists governance;
create schema if not exists publication;
create schema if not exists consumption;
create schema if not exists audit;
create schema if not exists operations;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'processing_state_enum') then
    create type processing_state_enum as enum ('registered','stored','parsed','candidate_created','normalized','resolved','validated','quarantined','reviewed','published','projected','activated','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'review_state_enum') then
    create type review_state_enum as enum ('not_reviewed','review_requested','accepted','rejected','needs_correction');
  end if;
  if not exists (select 1 from pg_type where typname = 'authority_state_enum') then
    create type authority_state_enum as enum ('candidate','accepted','superseded','rejected','restricted','planning_grade');
  end if;
  if not exists (select 1 from pg_type where typname = 'publication_state_enum') then
    create type publication_state_enum as enum ('draft','built','activated','failed','rolled_back');
  end if;
  if not exists (select 1 from pg_type where typname = 'lifecycle_state_enum') then
    create type lifecycle_state_enum as enum ('active','planned','retiring','retired','unknown');
  end if;
  if not exists (select 1 from pg_type where typname = 'freshness_state_enum') then
    create type freshness_state_enum as enum ('current','aging','stale','unknown');
  end if;
  if not exists (select 1 from pg_type where typname = 'availability_state_enum') then
    create type availability_state_enum as enum ('available','withheld','restricted','missing','unknown');
  end if;
  if not exists (select 1 from pg_type where typname = 'disclosure_mode_enum') then
    create type disclosure_mode_enum as enum ('exact','range','indexed','trend_only','withheld');
  end if;
  if not exists (select 1 from pg_type where typname = 'conflict_state_enum') then
    create type conflict_state_enum as enum ('none','possible','confirmed','resolved');
  end if;
  if not exists (select 1 from pg_type where typname = 'current_target_state_enum') then
    create type current_target_state_enum as enum ('current','target','current_and_target','unknown');
  end if;
end $$;

create or replace function audit.assert_hcdn_tenant(target_tenant text)
returns void language plpgsql as $$
begin
  if target_tenant is null or btrim(target_tenant) = '' then
    raise exception 'blank tenant is not allowed';
  end if;
  if target_tenant in ('all','*','%') then
    raise exception 'wildcard tenant is not allowed: %', target_tenant;
  end if;
  if target_tenant <> 'hc-demo-new' then
    raise exception 'wrong tenant: %', target_tenant;
  end if;
end $$;

create or replace function audit.assert_manifest_hash(expected_hash text, actual_hash text)
returns void language plpgsql as $$
begin
  if expected_hash is null or actual_hash is null or expected_hash <> actual_hash then
    raise exception 'manifest hash mismatch';
  end if;
end $$;

create table if not exists operations.job_run (
  job_run_id bigserial primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  run_ref text not null unique,
  job_name text not null,
  manifest_hash text not null,
  processing_state processing_state_enum not null default 'registered',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  idempotency_key text not null unique
);

create table if not exists operations.job_stage (
  job_stage_id bigserial primary key,
  job_run_id bigint not null references operations.job_run(job_run_id),
  stage_name text not null,
  processing_state processing_state_enum not null,
  checkpoint_ref text,
  retry_policy jsonb not null default '{}'::jsonb,
  partial_success_behavior text not null,
  quarantine_behavior text not null,
  audit_event_ref text,
  replay_behavior text not null,
  created_at timestamptz not null default now(),
  unique(job_run_id, stage_name)
);

create table if not exists operations.job_checkpoint (
  checkpoint_id bigserial primary key,
  job_run_id bigint not null references operations.job_run(job_run_id),
  stage_name text not null,
  checkpoint_hash text not null,
  checkpoint_payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(job_run_id, stage_name, checkpoint_hash)
);

create table if not exists operations.job_attempt (
  attempt_id bigserial primary key,
  job_run_id bigint not null references operations.job_run(job_run_id),
  stage_name text not null,
  attempt_number int not null,
  processing_state processing_state_enum not null,
  error_message text,
  created_at timestamptz not null default now(),
  unique(job_run_id, stage_name, attempt_number)
);

create table if not exists operations.load_result (
  load_result_id bigserial primary key,
  job_run_id bigint not null references operations.job_run(job_run_id),
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists operations.quarantine_summary (
  quarantine_summary_id bigserial primary key,
  job_run_id bigint not null references operations.job_run(job_run_id),
  quarantined_count int not null,
  summary_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists operations.backfill_queue (
  backfill_id bigserial primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  reason text not null,
  payload jsonb not null,
  processing_state processing_state_enum not null default 'registered',
  created_at timestamptz not null default now()
);

create table if not exists source_registry.parser_contract (
  parser_contract_ref text primary key,
  contract_version text not null,
  input_schema jsonb not null,
  output_schema jsonb not null,
  active boolean not null default true
);

create table if not exists source_registry.source (
  source_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  source_family text not null,
  source_name text not null,
  source_owner_role text not null,
  source_basis text not null,
  restricted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists source_registry.source_version (
  source_version_ref text primary key,
  source_ref text not null references source_registry.source(source_ref),
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  version_number int not null,
  blob_uri text not null,
  content_hash text not null,
  manifest_hash text not null,
  parser_contract_ref text not null references source_registry.parser_contract(parser_contract_ref),
  processing_state processing_state_enum not null default 'stored',
  recorded_at timestamptz not null default now(),
  immutable boolean not null default true,
  unique(source_ref, version_number),
  unique(source_ref, content_hash)
);

create table if not exists source_registry.source_native_identity (
  native_identity_ref text primary key,
  source_version_ref text not null references source_registry.source_version(source_version_ref),
  native_key text not null,
  native_label text not null,
  canonical_entity_ref text,
  created_at timestamptz not null default now(),
  unique(source_version_ref, native_key)
);

create table if not exists source_registry.source_manifest (
  manifest_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  manifest_hash text not null unique,
  source_version_refs text[] not null,
  created_at timestamptz not null default now()
);

create table if not exists evidence.evidence_item (
  evidence_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  source_version_ref text not null references source_registry.source_version(source_version_ref),
  evidence_type text not null,
  title text not null,
  source_row_ref text,
  evidence_hash text not null,
  freshness_state freshness_state_enum not null default 'current',
  availability_state availability_state_enum not null default 'available',
  valid_from date,
  valid_to date,
  recorded_at timestamptz not null default now(),
  unique(source_version_ref, evidence_hash)
);

create table if not exists evidence.evidence_locator (
  locator_ref text primary key,
  evidence_ref text not null references evidence.evidence_item(evidence_ref),
  locator_type text not null,
  locator_value text not null,
  created_at timestamptz not null default now()
);

create table if not exists evidence.extracted_fragment (
  fragment_ref text primary key,
  evidence_ref text not null references evidence.evidence_item(evidence_ref),
  fragment_text text not null,
  fragment_json jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists evidence.evidence_access_policy (
  policy_ref text primary key,
  evidence_ref text not null references evidence.evidence_item(evidence_ref),
  sensitivity_label text not null,
  allowed_role text not null,
  created_at timestamptz not null default now()
);

create table if not exists working.entity_candidate (
  entity_candidate_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  source_version_ref text not null references source_registry.source_version(source_version_ref),
  source_native_ref text not null,
  object_class text not null,
  candidate_name text not null,
  candidate_payload jsonb not null,
  processing_state processing_state_enum not null default 'candidate_created',
  review_state review_state_enum not null default 'not_reviewed',
  evidence_refs text[] not null default '{}',
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists working.fact_candidate (
  fact_candidate_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  entity_candidate_ref text references working.entity_candidate(entity_candidate_ref),
  predicate text not null,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  value_date date,
  value_timestamp timestamptz,
  value_json jsonb,
  object_entity_candidate_ref text,
  unit_ref text,
  evidence_refs text[] not null default '{}',
  review_state review_state_enum not null default 'not_reviewed',
  conflict_state conflict_state_enum not null default 'none',
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  constraint fact_candidate_one_value check (num_nonnulls(value_text,value_numeric,value_boolean,value_date,value_timestamp,value_json,object_entity_candidate_ref) = 1)
);

create table if not exists working.relationship_candidate (
  relationship_candidate_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  from_entity_candidate_ref text not null references working.entity_candidate(entity_candidate_ref),
  relationship_type text not null,
  to_entity_candidate_ref text not null references working.entity_candidate(entity_candidate_ref),
  evidence_refs text[] not null default '{}',
  review_state review_state_enum not null default 'not_reviewed',
  conflict_state conflict_state_enum not null default 'none',
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists working.metric_candidate (
  metric_candidate_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  metric_name text not null,
  disclosure_mode disclosure_mode_enum not null,
  value_numeric numeric,
  value_range_low numeric,
  value_range_high numeric,
  value_index numeric,
  withheld_reason text,
  evidence_refs text[] not null default '{}',
  review_state review_state_enum not null default 'not_reviewed',
  idempotency_key text not null unique,
  constraint metric_candidate_disclosure_value check (
    (disclosure_mode = 'exact' and value_numeric is not null and value_range_low is null and value_range_high is null and withheld_reason is null)
    or (disclosure_mode = 'range' and value_numeric is null and value_range_low is not null and value_range_high is not null and withheld_reason is null)
    or (disclosure_mode = 'withheld' and value_numeric is null and value_range_low is null and value_range_high is null and withheld_reason is not null)
    or (disclosure_mode in ('indexed','trend_only'))
  )
);

create table if not exists working.entity_resolution_candidate (
  resolution_candidate_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  candidate_refs text[] not null,
  proposed_entity_ref text not null,
  confidence numeric not null check (confidence between 0 and 1),
  resolution_reason text not null,
  review_state review_state_enum not null default 'not_reviewed'
);

create table if not exists working.normalization_result (
  normalization_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  candidate_ref text not null,
  normalized_payload jsonb not null,
  processing_state processing_state_enum not null default 'normalized',
  created_at timestamptz not null default now()
);

create table if not exists working.quarantine_item (
  quarantine_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  source_version_ref text not null references source_registry.source_version(source_version_ref),
  source_row_ref text,
  reason_code text not null,
  reason_detail text not null,
  source_lineage jsonb not null,
  processing_state processing_state_enum not null default 'quarantined',
  created_at timestamptz not null default now()
);

create table if not exists knowledge.entity (
  entity_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  object_class text not null,
  display_name text not null,
  lifecycle_state lifecycle_state_enum not null default 'active',
  current_target_state current_target_state_enum not null default 'current',
  authority_state authority_state_enum not null default 'accepted',
  valid_from date,
  valid_to date,
  recorded_at timestamptz not null default now(),
  superseded_at timestamptz
);

create table if not exists knowledge.entity_alias (
  alias_ref text primary key,
  entity_ref text not null references knowledge.entity(entity_ref),
  alias_text text not null,
  authority_state authority_state_enum not null default 'accepted',
  source_version_ref text references source_registry.source_version(source_version_ref),
  unique(entity_ref, alias_text)
);

create table if not exists knowledge.entity_source_identity (
  entity_source_identity_ref text primary key,
  entity_ref text not null references knowledge.entity(entity_ref),
  source_ref text not null references source_registry.source(source_ref),
  native_key text not null,
  unique(source_ref, native_key)
);

create table if not exists knowledge.organization (entity_ref text primary key references knowledge.entity(entity_ref), organization_type text not null);
create table if not exists knowledge.facility (entity_ref text primary key references knowledge.entity(entity_ref), facility_type text not null);
create table if not exists knowledge.capability (entity_ref text primary key references knowledge.entity(entity_ref), capability_domain text not null);
create table if not exists knowledge.process (entity_ref text primary key references knowledge.entity(entity_ref), process_domain text not null);
create table if not exists knowledge.application (entity_ref text primary key references knowledge.entity(entity_ref), criticality text not null, lifecycle_detail text);
create table if not exists knowledge.platform (entity_ref text primary key references knowledge.entity(entity_ref), platform_type text not null);
create table if not exists knowledge.data_domain (entity_ref text primary key references knowledge.entity(entity_ref), data_domain_type text not null);
create table if not exists knowledge.data_product (entity_ref text primary key references knowledge.entity(entity_ref), product_domain text not null);
create table if not exists knowledge.data_asset (entity_ref text primary key references knowledge.entity(entity_ref), asset_type text not null);
create table if not exists knowledge.pipeline (entity_ref text primary key references knowledge.entity(entity_ref), pipeline_type text not null);
create table if not exists knowledge.vendor (entity_ref text primary key references knowledge.entity(entity_ref), vendor_category text not null);
create table if not exists knowledge.contract (entity_ref text primary key references knowledge.entity(entity_ref), contract_type text not null);
create table if not exists knowledge.program (entity_ref text primary key references knowledge.entity(entity_ref), program_type text not null);
create table if not exists knowledge.risk (entity_ref text primary key references knowledge.entity(entity_ref), risk_domain text not null);
create table if not exists knowledge.control (entity_ref text primary key references knowledge.entity(entity_ref), control_domain text not null);
create table if not exists knowledge.ai_use_case (entity_ref text primary key references knowledge.entity(entity_ref), use_case_domain text not null);
create table if not exists knowledge.decision (entity_ref text primary key references knowledge.entity(entity_ref), decision_type text not null);
create table if not exists knowledge.policy (entity_ref text primary key references knowledge.entity(entity_ref), policy_type text not null);
create table if not exists knowledge.constraint (entity_ref text primary key references knowledge.entity(entity_ref), constraint_type text not null);
create table if not exists knowledge.assumption (entity_ref text primary key references knowledge.entity(entity_ref), assumption_type text not null);

create table if not exists knowledge.relationship_type (
  relationship_type_code text primary key,
  display_name text not null,
  inverse_type_code text,
  allowed_from_entity_types text[] not null,
  allowed_to_entity_types text[] not null,
  is_directional boolean not null default true,
  is_transitive boolean not null default false,
  is_symmetric boolean not null default false,
  evidence_requirement text not null default 'evidence_or_attestation_required',
  current_target_allowed boolean not null default true,
  version int not null default 1,
  active boolean not null default true
);

create table if not exists knowledge.fact_assertion (
  fact_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  entity_ref text not null references knowledge.entity(entity_ref),
  predicate text not null,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  value_date date,
  value_timestamp timestamptz,
  value_json jsonb,
  object_entity_ref text references knowledge.entity(entity_ref),
  unit_ref text,
  evidence_refs text[] not null,
  authority_state authority_state_enum not null default 'accepted',
  disclosure_mode disclosure_mode_enum,
  valid_from date,
  valid_to date,
  recorded_at timestamptz not null default now(),
  superseded_at timestamptz,
  supersedes_fact_ref text references knowledge.fact_assertion(fact_ref),
  constraint fact_assertion_one_value check (num_nonnulls(value_text,value_numeric,value_boolean,value_date,value_timestamp,value_json,object_entity_ref) = 1)
);

create unique index if not exists fact_assertion_current_unique on knowledge.fact_assertion(entity_ref, predicate) where authority_state = 'accepted' and superseded_at is null;

create table if not exists knowledge.relationship_assertion (
  relationship_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  from_entity_ref text not null references knowledge.entity(entity_ref),
  relationship_type text not null references knowledge.relationship_type(relationship_type_code),
  to_entity_ref text not null references knowledge.entity(entity_ref),
  business_meaning text not null default '',
  relationship_scope text not null default 'enterprise',
  environment text not null default 'current',
  criticality text not null default 'unknown',
  dependency_strength numeric check (dependency_strength is null or dependency_strength between 0 and 1),
  cardinality text not null default 'unknown',
  evidence_refs text[] not null,
  evidence_status text not null default 'evidence_backed',
  confidence numeric not null default 1 check (confidence between 0 and 1),
  review_state review_state_enum not null default 'accepted',
  authority_state authority_state_enum not null default 'accepted',
  publication_state publication_state_enum not null default 'built',
  freshness_state freshness_state_enum not null default 'current',
  conflict_state conflict_state_enum not null default 'none',
  current_target_state current_target_state_enum not null default 'current',
  source_assertion_count int not null default 1 check (source_assertion_count >= 0),
  valid_from date,
  valid_to date,
  recorded_at timestamptz not null default now(),
  superseded_at timestamptz,
  supersedes_relationship_ref text references knowledge.relationship_assertion(relationship_ref)
);

create unique index if not exists relationship_assertion_current_unique on knowledge.relationship_assertion(from_entity_ref, relationship_type, to_entity_ref) where authority_state = 'accepted' and superseded_at is null;
create index if not exists idx_relationship_assertion_from on knowledge.relationship_assertion(tenant_key, from_entity_ref, authority_state, current_target_state);
create index if not exists idx_relationship_assertion_to on knowledge.relationship_assertion(tenant_key, to_entity_ref, authority_state, current_target_state);
create index if not exists idx_relationship_assertion_type on knowledge.relationship_assertion(tenant_key, relationship_type, authority_state);

create table if not exists knowledge.relationship_evidence (
  relationship_ref text not null references knowledge.relationship_assertion(relationship_ref),
  evidence_ref text not null references evidence.evidence_item(evidence_ref),
  evidence_role text not null default 'supporting',
  primary key (relationship_ref, evidence_ref)
);

create or replace function knowledge.validate_relationship_assertion()
returns trigger language plpgsql as $$
declare
  from_type text;
  to_type text;
  type_row knowledge.relationship_type%rowtype;
begin
  select object_class into from_type from knowledge.entity where entity_ref = new.from_entity_ref and tenant_key = new.tenant_key;
  select object_class into to_type from knowledge.entity where entity_ref = new.to_entity_ref and tenant_key = new.tenant_key;
  select * into type_row from knowledge.relationship_type where relationship_type_code = new.relationship_type and active;
  if from_type is null or to_type is null then
    raise exception 'relationship endpoints must be tenant-local entities';
  end if;
  if type_row.relationship_type_code is null then
    raise exception 'relationship type is not active: %', new.relationship_type;
  end if;
  if not (from_type = any(type_row.allowed_from_entity_types)) then
    raise exception 'invalid relationship from type: % -> %', from_type, new.relationship_type;
  end if;
  if not (to_type = any(type_row.allowed_to_entity_types)) then
    raise exception 'invalid relationship to type: % -> %', new.relationship_type, to_type;
  end if;
  if new.authority_state = 'accepted' and new.evidence_status <> 'approved_attestation' and cardinality(new.evidence_refs) = 0 then
    raise exception 'accepted relationship requires evidence or approved attestation';
  end if;
  return new;
end $$;

drop trigger if exists trg_validate_relationship_assertion on knowledge.relationship_assertion;
create trigger trg_validate_relationship_assertion
before insert or update on knowledge.relationship_assertion
for each row execute function knowledge.validate_relationship_assertion();

create table if not exists metrics.metric_definition (
  metric_definition_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  metric_name text not null,
  definition_text text not null,
  unit_ref text not null,
  authority_state authority_state_enum not null default 'accepted'
);

create table if not exists metrics.metric_observation (
  metric_observation_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  metric_definition_ref text not null references metrics.metric_definition(metric_definition_ref),
  entity_ref text references knowledge.entity(entity_ref),
  observation_period text not null,
  disclosure_mode disclosure_mode_enum not null,
  value_numeric numeric,
  value_range_low numeric,
  value_range_high numeric,
  value_index numeric,
  withheld_reason text,
  evidence_refs text[] not null,
  authority_state authority_state_enum not null default 'accepted',
  recorded_at timestamptz not null default now(),
  constraint metric_observation_disclosure_value check (
    (disclosure_mode = 'exact' and value_numeric is not null and value_range_low is null and value_range_high is null and withheld_reason is null)
    or (disclosure_mode = 'range' and value_numeric is null and value_range_low is not null and value_range_high is not null and withheld_reason is null)
    or (disclosure_mode = 'withheld' and value_numeric is null and value_range_low is null and value_range_high is null and withheld_reason is not null)
    or (disclosure_mode in ('indexed','trend_only'))
  )
);

create table if not exists metrics.metric_target (
  metric_target_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  metric_definition_ref text not null references metrics.metric_definition(metric_definition_ref),
  target_payload jsonb not null,
  authority_state authority_state_enum not null default 'candidate'
);

create table if not exists metrics.metric_attestation (
  attestation_ref text primary key,
  metric_observation_ref text not null references metrics.metric_observation(metric_observation_ref),
  attested_by_role text not null,
  attestation_state review_state_enum not null
);

create table if not exists governance.review_decision (
  review_decision_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  target_ref text not null,
  target_kind text not null,
  review_state review_state_enum not null,
  authority_state authority_state_enum not null,
  reviewer_role text not null,
  rationale text not null,
  decided_at timestamptz not null default now()
);

create table if not exists governance.authority_transition (
  transition_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  target_ref text not null,
  from_authority_state authority_state_enum,
  to_authority_state authority_state_enum not null,
  transition_reason text not null,
  review_decision_ref text references governance.review_decision(review_decision_ref),
  created_at timestamptz not null default now()
);

create table if not exists governance.knowledge_gap (
  gap_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  gap_type text not null,
  description text not null,
  evidence_needed text not null,
  owner_role text not null,
  availability_state availability_state_enum not null default 'missing',
  authority_state authority_state_enum not null default 'candidate'
);

create table if not exists governance.knowledge_conflict (
  conflict_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  conflict_type text not null,
  subject_ref text not null,
  conflicting_refs text[] not null,
  conflict_state conflict_state_enum not null default 'confirmed',
  resolution_ref text,
  created_at timestamptz not null default now()
);

create table if not exists governance.completion_work_item (
  work_item_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  gap_ref text references governance.knowledge_gap(gap_ref),
  owner_role text not null,
  work_item_state processing_state_enum not null default 'registered'
);

create table if not exists governance.supersession_record (
  supersession_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  old_ref text not null,
  new_ref text not null,
  object_kind text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists publication.domain_publication (
  domain_publication_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  domain_ref text not null,
  version_number int not null,
  publication_state publication_state_enum not null default 'draft',
  source_manifest_hash text not null,
  built_at timestamptz not null default now(),
  activated_at timestamptz,
  immutable boolean not null default true,
  unique(domain_ref, version_number)
);

create table if not exists publication.domain_publication_item (
  publication_item_ref text primary key,
  domain_publication_ref text not null references publication.domain_publication(domain_publication_ref),
  item_kind text not null,
  item_ref text not null,
  item_hash text not null,
  unique(domain_publication_ref, item_kind, item_ref)
);

create table if not exists publication.knowledge_baseline (
  knowledge_baseline_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  baseline_version int not null,
  publication_state publication_state_enum not null default 'draft',
  baseline_manifest jsonb not null,
  built_at timestamptz not null default now(),
  activated_at timestamptz,
  unique(tenant_key, baseline_version)
);

create table if not exists publication.knowledge_baseline_domain (
  baseline_domain_ref text primary key,
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  domain_publication_ref text not null references publication.domain_publication(domain_publication_ref),
  unique(knowledge_baseline_ref, domain_publication_ref)
);

create table if not exists publication.publication_activation (
  activation_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  publication_state publication_state_enum not null,
  activated_at timestamptz not null default now(),
  is_current boolean not null default false
);

create unique index if not exists one_current_activation_per_tenant on publication.publication_activation(tenant_key) where is_current;

create table if not exists publication.publication_rollback (
  rollback_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  from_activation_ref text not null references publication.publication_activation(activation_ref),
  to_activation_ref text not null references publication.publication_activation(activation_ref),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists consumption.enterprise_brief (
  enterprise_brief_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  title text not null,
  executive_summary text not null,
  evidence_refs text[] not null,
  gaps text[] not null,
  authority_summary jsonb not null,
  publication_state publication_state_enum not null default 'built'
);

create table if not exists consumption.domain_overview (
  domain_overview_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  domain_ref text not null,
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  overview_payload jsonb not null
);

create table if not exists consumption.entity_inventory (
  inventory_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  object_class text not null,
  entity_ref text not null references knowledge.entity(entity_ref),
  display_name text not null,
  authority_state authority_state_enum not null,
  evidence_refs text[] not null
);

create table if not exists consumption.entity_detail (
  entity_detail_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  entity_ref text not null references knowledge.entity(entity_ref),
  detail_payload jsonb not null
);

create table if not exists consumption.relationship_projection (
  relationship_projection_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  from_entity_ref text not null,
  relationship_type text not null,
  to_entity_ref text not null,
  evidence_refs text[] not null,
  authority_state authority_state_enum not null
);

create table if not exists consumption.relationship_node_v1 (
  graph_node_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  entity_ref text not null references knowledge.entity(entity_ref),
  entity_type text not null,
  display_name text not null,
  lifecycle_state lifecycle_state_enum not null,
  current_target_state current_target_state_enum not null,
  authority_state authority_state_enum not null
);

create table if not exists consumption.relationship_edge_v1 (
  graph_edge_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  relationship_ref text not null references knowledge.relationship_assertion(relationship_ref),
  from_entity_ref text not null references knowledge.entity(entity_ref),
  relationship_type text not null references knowledge.relationship_type(relationship_type_code),
  to_entity_ref text not null references knowledge.entity(entity_ref),
  current_target_state current_target_state_enum not null,
  evidence_refs text[] not null,
  authority_state authority_state_enum not null,
  relationship_publication_version text not null
);

create table if not exists consumption.relationship_graph_v1 (
  graph_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  relationship_publication_version text not null,
  query_preset text not null,
  focal_entity_ref text references knowledge.entity(entity_ref),
  hop_depth int not null check (hop_depth between 0 and 3),
  authority_filter authority_state_enum not null default 'accepted',
  current_target_state current_target_state_enum not null default 'current',
  node_count int not null,
  edge_count int not null,
  coverage jsonb not null,
  limitations text[] not null default '{}'
);

create table if not exists consumption.relationship_evidence_v1 (
  graph_evidence_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  relationship_ref text not null references knowledge.relationship_assertion(relationship_ref),
  evidence_ref text not null references evidence.evidence_item(evidence_ref),
  evidence_role text not null
);

create table if not exists consumption.relationship_query_index_v1 (
  query_index_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  query_preset text not null,
  allowed_relationship_types text[] not null,
  default_hop_depth int not null,
  max_nodes int not null,
  empty_state_message text not null
);

create table if not exists consumption.entity_impact_summary_v1 (
  impact_summary_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  entity_ref text not null references knowledge.entity(entity_ref),
  one_hop_neighbors int not null,
  two_hop_neighbors int not null,
  candidate_edges_excluded int not null,
  open_gap_refs text[] not null default '{}',
  summary_payload jsonb not null
);

create index if not exists idx_graph_edge_from on consumption.relationship_edge_v1(tenant_key, knowledge_baseline_ref, from_entity_ref, authority_state);
create index if not exists idx_graph_edge_to on consumption.relationship_edge_v1(tenant_key, knowledge_baseline_ref, to_entity_ref, authority_state);
create index if not exists idx_graph_edge_type on consumption.relationship_edge_v1(tenant_key, knowledge_baseline_ref, relationship_type);
create index if not exists idx_entity_inventory_class on consumption.entity_inventory(tenant_key, knowledge_baseline_ref, object_class);

create table if not exists consumption.metric_projection (
  metric_projection_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  metric_definition_ref text not null,
  projection_payload jsonb not null
);

create table if not exists consumption.evidence_gap_projection (
  evidence_gap_projection_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  gap_ref text not null,
  projection_payload jsonb not null
);

create table if not exists consumption.strategic_insight (
  strategic_insight_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  insight_text text not null,
  evidence_refs text[] not null,
  authority_state authority_state_enum not null default 'accepted'
);

create table if not exists consumption.executive_perspective (
  executive_perspective_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  perspective_text text not null,
  evidence_refs text[] not null,
  authority_state authority_state_enum not null default 'planning_grade'
);

create table if not exists consumption.industry_assessment (
  industry_assessment_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  assessment_payload jsonb not null,
  authority_state authority_state_enum not null default 'planning_grade'
);

create table if not exists consumption.search_document (
  search_document_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  document_title text not null,
  document_text text not null,
  metadata jsonb not null,
  evidence_refs text[] not null
);

create index if not exists idx_search_document_metadata on consumption.search_document using gin(metadata);

create table if not exists consumption.module_packet_projection (
  module_packet_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  target_module text not null,
  packet_payload jsonb not null,
  packet_hash text not null
);

create table if not exists audit.change_event (
  change_event_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  event_type text not null,
  target_ref text not null,
  event_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists audit.access_event (
  access_event_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  actor_role text not null,
  access_target text not null,
  access_result text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit.model_execution (
  model_execution_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  packet_hash text not null,
  model_provider text,
  model_name text,
  execution_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists audit.rule_execution (
  rule_execution_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  rule_name text not null,
  result text not null,
  target_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit.publication_lineage (
  publication_lineage_ref text primary key,
  tenant_key text not null check (tenant_key = 'hc-demo-new'),
  knowledge_baseline_ref text not null references publication.knowledge_baseline(knowledge_baseline_ref),
  lineage_payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function publication.activate_baseline(p_baseline_ref text, p_activation_ref text)
returns void language plpgsql as $$
declare
  p_tenant text;
begin
  select tenant_key into p_tenant from publication.knowledge_baseline where knowledge_baseline_ref = p_baseline_ref and publication_state = 'built';
  if p_tenant is null then
    raise exception 'baseline is not built or does not exist: %', p_baseline_ref;
  end if;
  perform audit.assert_hcdn_tenant(p_tenant);
  update publication.publication_activation set is_current = false where tenant_key = p_tenant and is_current = true;
  insert into publication.publication_activation(activation_ref, tenant_key, knowledge_baseline_ref, publication_state, is_current)
  values (p_activation_ref, p_tenant, p_baseline_ref, 'activated', true);
  update publication.knowledge_baseline set publication_state = 'activated', activated_at = now() where knowledge_baseline_ref = p_baseline_ref;
end $$;

create or replace function publication.try_failed_activation(p_baseline_ref text, p_activation_ref text)
returns void language plpgsql as $$
begin
  insert into publication.publication_activation(activation_ref, tenant_key, knowledge_baseline_ref, publication_state, is_current)
  select p_activation_ref, tenant_key, knowledge_baseline_ref, 'failed', false
  from publication.knowledge_baseline
  where knowledge_baseline_ref = p_baseline_ref;
end $$;

alter table source_registry.source enable row level security;
alter table knowledge.entity enable row level security;
alter table consumption.enterprise_brief enable row level security;

drop policy if exists hcdn_source_tenant_policy on source_registry.source;
create policy hcdn_source_tenant_policy on source_registry.source for all using (tenant_key = 'hc-demo-new') with check (tenant_key = 'hc-demo-new');
drop policy if exists hcdn_entity_tenant_policy on knowledge.entity;
create policy hcdn_entity_tenant_policy on knowledge.entity for all using (tenant_key = 'hc-demo-new') with check (tenant_key = 'hc-demo-new');
drop policy if exists hcdn_brief_tenant_policy on consumption.enterprise_brief;
create policy hcdn_brief_tenant_policy on consumption.enterprise_brief for all using (tenant_key = 'hc-demo-new') with check (tenant_key = 'hc-demo-new');
