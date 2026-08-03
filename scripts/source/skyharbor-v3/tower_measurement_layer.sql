-- Tower measurement layer five-table design.
-- Planning artifact only. Do not apply as a production migration without review.
--
-- This complements the flexible Source six-table design:
--   Source/doc tables preserve and resolve source evidence.
--   Tower tables store typed measurement semantics and deterministic value gates.

create schema if not exists tower;
create schema if not exists governance;
create schema if not exists narrative;

create table if not exists tower.metric_definition (
  metric_ref text primary key,
  domain text not null,
  label text not null,
  description text not null,
  value_type text not null check (value_type in ('numeric', 'text', 'date', 'boolean')),
  unit text,
  aggregation_rule text not null check (
    aggregation_rule in ('sum', 'average', 'weighted_average', 'ratio', 'ending_balance', 'non_additive')
  ),
  directionality text not null check (directionality in ('higher_is_better', 'lower_is_better', 'neutral')),
  formula_version text not null,
  freshness_days int,
  required_sample_size numeric,
  claim_gate_rule text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists tower.tracked_subject (
  subject_ref text primary key,
  tenant_key text not null,
  subject_kind text not null check (
    subject_kind in (
      'initiative',
      'developer_ai_tool',
      'service_agent',
      'hr_agent',
      'workflow',
      'team',
      'repository',
      'application',
      'contract',
      'vendor',
      'cloud_estate',
      'data_platform'
    )
  ),
  title text not null,
  vendor_ref text,
  contract_ref text,
  initiative_ref text,
  application_ref text,
  function_ref text,
  workflow_ref text,
  owner_role text,
  launch_date date,
  funding_status text,
  metadata_json jsonb not null default '{}'::jsonb,
  unique (tenant_key, subject_ref)
);

create table if not exists tower.metric_provenance (
  provenance_id text primary key,
  tenant_key text not null,
  source_system text not null,
  source_report text,
  source_schema text,
  source_table text,
  source_file_id text,
  source_row_pointer text,
  formula text not null,
  formula_version text not null,
  extraction_method text not null,
  historical_depth text,
  refresh_cadence text,
  last_refreshed timestamptz,
  known_limitations text,
  data_owner_role text not null,
  quality_score numeric,
  attestation_status text not null default 'not_attested',
  unique (tenant_key, provenance_id)
);

create table if not exists tower.metric_observation (
  observation_id text primary key,
  tenant_key text not null,
  subject_ref text not null,
  metric_ref text not null references tower.metric_definition(metric_ref),
  period_start date not null,
  period_end date not null,
  scenario text not null check (scenario in ('baseline', 'target', 'actual', 'forecast')),
  value_num numeric,
  value_text text,
  unit text,
  currency text,
  numerator numeric,
  denominator numeric,
  sample_size numeric,
  cohort_ref text,
  dimension_json jsonb not null default '{}'::jsonb,
  provenance_id text not null,
  source_result_hash text not null,
  quality_state text not null default 'unreviewed',
  evidence_state text not null default 'missing',
  observed_at timestamptz not null default now(),
  stale_at timestamptz,
  unique (tenant_key, observation_id),
  constraint metric_observation_subject_fk foreign key (tenant_key, subject_ref)
    references tower.tracked_subject (tenant_key, subject_ref),
  constraint metric_observation_provenance_fk foreign key (tenant_key, provenance_id)
    references tower.metric_provenance (tenant_key, provenance_id),
  constraint metric_observation_one_value check (num_nonnulls(value_num, value_text) = 1),
  constraint metric_observation_period_check check (period_end >= period_start)
);

create table if not exists tower.value_claim (
  claim_id text primary key,
  tenant_key text not null,
  subject_ref text not null,
  outcome_metric_ref text not null references tower.metric_definition(metric_ref),
  baseline_observation_id text,
  target_observation_id text,
  actual_observation_id text,
  promised_value numeric,
  calculated_value numeric,
  currency text,
  attribution_basis text,
  quality_guardrail_state text not null default 'not_evaluated',
  risk_guardrail_state text not null default 'not_evaluated',
  claim_state text not null check (
    claim_state in (
      'idea',
      'funded_no_baseline',
      'baseline_captured',
      'usage_supported',
      'finance_validated',
      'claimable',
      'disputed',
      'stale'
    )
  ),
  claim_rule_version text not null,
  claim_input_hash text not null,
  caveat text,
  blocked_reason text,
  next_gate text,
  next_gate_owner_role text,
  evaluated_at timestamptz not null default now(),
  stale_at timestamptz,
  stale_reason text,
  unique (tenant_key, claim_id),
  constraint value_claim_subject_fk foreign key (tenant_key, subject_ref)
    references tower.tracked_subject (tenant_key, subject_ref),
  constraint value_claim_baseline_fk foreign key (tenant_key, baseline_observation_id)
    references tower.metric_observation (tenant_key, observation_id),
  constraint value_claim_target_fk foreign key (tenant_key, target_observation_id)
    references tower.metric_observation (tenant_key, observation_id),
  constraint value_claim_actual_fk foreign key (tenant_key, actual_observation_id)
    references tower.metric_observation (tenant_key, observation_id)
);

create index if not exists idx_tower_subject_kind
  on tower.tracked_subject (tenant_key, subject_kind, vendor_ref, contract_ref, initiative_ref);

create index if not exists idx_tower_metric_observation_subject
  on tower.metric_observation (tenant_key, subject_ref, metric_ref, scenario, period_start, period_end);

create index if not exists idx_tower_metric_observation_provenance
  on tower.metric_observation (tenant_key, provenance_id, quality_state, evidence_state);

create index if not exists idx_tower_value_claim_state
  on tower.value_claim (tenant_key, claim_state, subject_ref, outcome_metric_ref);

alter table tower.tracked_subject enable row level security;
alter table tower.metric_provenance enable row level security;
alter table tower.metric_observation enable row level security;
alter table tower.value_claim enable row level security;

drop policy if exists tracked_subject_tenant_isolation on tower.tracked_subject;
create policy tracked_subject_tenant_isolation on tower.tracked_subject
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists metric_provenance_tenant_isolation on tower.metric_provenance;
create policy metric_provenance_tenant_isolation on tower.metric_provenance
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists metric_observation_tenant_isolation on tower.metric_observation;
create policy metric_observation_tenant_isolation on tower.metric_observation
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists value_claim_tenant_isolation on tower.value_claim;
create policy value_claim_tenant_isolation on tower.value_claim
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

-- Read model sketches. Exact definitions should be generated from approved formulas and
-- claim rules, not hand-maintained independently.

create or replace view tower.value_claim_current as
select *
from tower.value_claim
where stale_at is null;

create or replace view tower.metric_provenance_current as
select *
from tower.metric_provenance;

create or replace view tower.disputed_metric as
select *
from tower.value_claim_current
where claim_state = 'disputed';

create or replace view tower.stale_metric as
select *
from tower.value_claim
where claim_state = 'stale' or stale_at is not null;

create or replace view tower.value_funnel as
select
  tenant_key,
  sum(coalesce(promised_value, 0)) as promised_value,
  coalesce(sum(coalesce(calculated_value, 0)) filter (where claim_state in ('usage_supported', 'finance_validated', 'claimable')), 0) as usage_supported_value,
  coalesce(sum(coalesce(calculated_value, 0)) filter (where claim_state in ('finance_validated', 'claimable')), 0) as finance_validated_value,
  coalesce(sum(coalesce(calculated_value, 0)) filter (where claim_state = 'claimable'), 0) as claimable_value,
  coalesce(sum(coalesce(promised_value, 0)) filter (where claim_state not in ('claimable')), 0) as blocked_value,
  coalesce(sum(coalesce(promised_value, 0)) filter (where claim_state = 'disputed'), 0) as disputed_value,
  coalesce(sum(coalesce(promised_value, 0)) filter (where claim_state = 'stale'), 0) as stale_value
from tower.value_claim_current
group by tenant_key;

-- Future deterministic finding tables, shown here only as boundary markers:
--   narrative.finding_rule
--   narrative.finding_result
--   narrative.artifact
--   governance.review_event
