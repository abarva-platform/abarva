-- Local SkyHarbor Source + Tower measurement promotion.
-- Idempotent development/load script. It does not call Azure, LLMs, or production services.

create schema if not exists source;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function tower.slugify(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(regexp_replace(coalesce(value, 'unknown'), '[^A-Za-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
$$;

create or replace function tower.parse_num(value text)
returns numeric
language sql
immutable
as $$
  with cleaned as (
    select regexp_replace(coalesce(value, ''), '[^0-9.-]+', '', 'g') as value
  )
  select case
    when value ~ '^-?[0-9]+(\.[0-9]+)?$' then value::numeric
    when value ~ '^-?\.[0-9]+$' then value::numeric
    else null
  end
  from cleaned
$$;

create or replace function tower.period_start(value text)
returns date
language sql
immutable
as $$
  select case
    when value ~ '^[0-9]{4} Q[1-4]$' then
      make_date(split_part(value, ' ', 1)::int, ((right(value, 1)::int - 1) * 3) + 1, 1)
    when value ~ '^[0-9]{4}$' then make_date(value::int, 1, 1)
    else null
  end
$$;

create or replace function tower.period_end(value text)
returns date
language sql
immutable
as $$
  select case
    when value ~ '^[0-9]{4} Q[1-4]$' then
      (make_date(split_part(value, ' ', 1)::int, ((right(value, 1)::int - 1) * 3) + 1, 1)
        + interval '3 months - 1 day')::date
    when value ~ '^[0-9]{4}$' then make_date(value::int, 12, 31)
    else null
  end
$$;

-- ---------------------------------------------------------------------------
-- Source raw-file registration
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname in ('raw_enterprise_it', 'raw_data_analytics', 'raw_cloud_hybrid')
      and tablename <> '_column_map'
    order by schemaname, tablename
  loop
    execute format($sql$
      insert into doc.file (
        file_id,
        tenant_key,
        blob_uri,
        content_sha256,
        file_name,
        media_type,
        load_run_id,
        document_role,
        document_type,
        visibility_class,
        content_authenticity,
        metadata_json
      )
      select distinct
        'rawfile-' || md5(%L || '.' || %L || ':' || coalesce(_source_csv_sha256, 'no-sha')) as file_id,
        _tenant_key,
        'local://' || coalesce(_source_file, %L || '.' || %L) as blob_uri,
        coalesce(_source_csv_sha256, md5(%L || '.' || %L)) as content_sha256,
        coalesce(_source_file, %L || '.' || %L) as file_name,
        'text/csv' as media_type,
        _load_run_id,
        'raw_export' as document_role,
        'client_intake_csv' as document_type,
        'internal' as visibility_class,
        'synthetic' as content_authenticity,
        jsonb_build_object('source_schema', %L, 'source_table', %L, 'source_sheet', _source_sheet)
      from %I.%I
      where _tenant_key is not null
      on conflict (file_id) do update set
        blob_uri = excluded.blob_uri,
        content_sha256 = excluded.content_sha256,
        metadata_json = excluded.metadata_json
    $sql$, r.schemaname, r.tablename, r.schemaname, r.tablename, r.schemaname, r.tablename,
      r.schemaname, r.tablename, r.schemaname, r.tablename, r.schemaname, r.tablename,
      r.schemaname, r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Source concept definitions and contract extractions
-- ---------------------------------------------------------------------------

insert into meta.concept (concept_ref, domain, label, datatype, unit, definition)
values
  ('contract.annual_value', 'contract', 'Annual contract value', 'numeric', 'usd', 'Annual contract value from the raw vendor contract register.'),
  ('contract.total_committed_value', 'contract', 'Total committed value', 'numeric', 'usd', 'Total committed value from the raw vendor contract register.'),
  ('contract.end_date', 'contract', 'Contract end date', 'date', null, 'Contract end date from the raw vendor contract register.'),
  ('contract.notice_period_days', 'contract', 'Notice period days', 'numeric', 'days', 'Notice period in days.'),
  ('contract.auto_renew', 'contract', 'Auto renewal flag', 'boolean', null, 'Whether the contract auto-renews.'),
  ('contract.benchmarking_clause', 'contract', 'Benchmarking clause', 'text', null, 'Benchmarking rights and constraints.'),
  ('contract.exit_rights_summary', 'contract', 'Exit rights summary', 'text', null, 'Exit and termination rights summary.')
on conflict (concept_ref) do update set
  label = excluded.label,
  datatype = excluded.datatype,
  unit = excluded.unit,
  definition = excluded.definition,
  active = true;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_num, unit, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-annual-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.annual_value',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  annual_value::numeric,
  'usd',
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'annual_value',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.95,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(annual_value, '') is not null
on conflict (extraction_id) do update set value_num = excluded.value_num, source_file_id = excluded.source_file_id;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_num, unit, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-committed-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.total_committed_value',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  total_committed_value::numeric,
  'usd',
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'total_committed_value',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.95,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(total_committed_value, '') is not null
on conflict (extraction_id) do update set value_num = excluded.value_num, source_file_id = excluded.source_file_id;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_date, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-end-date-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.end_date',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  end_date::date,
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'end_date',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.95,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(end_date, '') is not null
on conflict (extraction_id) do update set value_date = excluded.value_date, source_file_id = excluded.source_file_id;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_num, unit, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-notice-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.notice_period_days',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  notice_period_days::numeric,
  'days',
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'notice_period_days',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.95,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(notice_period_days, '') is not null
on conflict (extraction_id) do update set value_num = excluded.value_num, source_file_id = excluded.source_file_id;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_bool, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-auto-renew-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.auto_renew',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  lower(auto_renew) in ('true', 'yes', 'y', '1'),
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'auto_renew',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.95,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(auto_renew, '') is not null
on conflict (extraction_id) do update set value_bool = excluded.value_bool, source_file_id = excluded.source_file_id;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_text, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-benchmarking-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.benchmarking_clause',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  benchmarking_clause,
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'benchmarking_clause',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.8,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(benchmarking_clause, '') is not null
on conflict (extraction_id) do update set value_text = excluded.value_text, source_file_id = excluded.source_file_id;

insert into doc.extraction (
  extraction_id, tenant_key, load_run_id, concept_ref, extractor_version, model_id, prompt_version,
  subject_kind, subject_ref, value_text, source_kind, source_table, source_row, source_column,
  source_file_id, confidence, method, review_state, visibility_class, content_authenticity
)
select
  'ext-contract-exit-rights-' || contract_id,
  _tenant_key,
  _load_run_id,
  'contract.exit_rights_summary',
  'local_raw_sql_v1',
  'deterministic_sql',
  'source_tower_measurement_promotion_v1',
  'contract',
  contract_id,
  exit_rights_summary,
  'column',
  'raw_enterprise_it.vendors_contracts',
  _source_row_number::int,
  'exit_rights_summary',
  'rawfile-' || md5('raw_enterprise_it.vendors_contracts:' || coalesce(_source_csv_sha256, 'no-sha')),
  0.8,
  'deterministic_rule',
  'unreviewed',
  'internal',
  'synthetic'
from raw_enterprise_it.vendors_contracts
where nullif(exit_rights_summary, '') is not null
on conflict (extraction_id) do update set value_text = excluded.value_text, source_file_id = excluded.source_file_id;

-- ---------------------------------------------------------------------------
-- Source cross-domain views
-- ---------------------------------------------------------------------------

create or replace view source.contract_vendor_360 as
select
  v._tenant_key as tenant_key,
  v.contract_id,
  v.vendor_id as vendor_ref,
  v.vendor_name,
  v.category as vendor_category,
  v.contract_name,
  v.scope_summary,
  v.annual_value::numeric as annual_value,
  v.total_committed_value::numeric as total_committed_value,
  v.committed_annual_spend::numeric as committed_annual_spend,
  v.actual_annual_spend::numeric as actual_annual_spend,
  v.end_date::date as end_date,
  v.notice_period_days::numeric as notice_period_days,
  lower(v.auto_renew) in ('true', 'yes', 'y', '1') as auto_renew,
  v.renewal_decision_state,
  v.renewal_owner_ref,
  v.benchmarking_clause,
  v.exit_rights_summary,
  v.alternatives_available,
  v.concentration_note,
  v.source_confidence,
  cw.annual_value as resolved_annual_value,
  cw.annual_value_conflict_flag,
  cw.total_committed_value as resolved_total_committed_value,
  cw.total_committed_value_conflict_flag
from raw_enterprise_it.vendors_contracts v
left join sem.contract_wide cw
  on cw.tenant_key = v._tenant_key
 and cw.contract_ref = v.contract_id;

create or replace view source.vendor_contract_portfolio as
select
  tenant_key,
  vendor_ref,
  vendor_name,
  vendor_category,
  count(*) as contract_count,
  sum(annual_value) as annual_value,
  sum(total_committed_value) as total_committed_value,
  count(*) filter (where auto_renew) as auto_renew_contracts,
  min(end_date) as next_end_date,
  array_agg(contract_id order by annual_value desc) as contract_refs
from source.contract_vendor_360
group by tenant_key, vendor_ref, vendor_name, vendor_category;

create or replace view source.contract_application_scope as
select
  v._tenant_key as tenant_key,
  v.contract_id,
  v.vendor_id as vendor_ref,
  v.vendor_name,
  a.application_id as application_ref,
  a.application_platform_name as application_name,
  a.primary_business_function as business_function,
  a.primary_business_function_ref as function_ref,
  a.business_criticality as criticality,
  a.lifecycle_status as lifecycle_state,
  a.hosting_model,
  a.annual_run_cost::numeric as annual_run_cost,
  a.planned_action as modernization_plan,
  a.availability_sla as sla_tier,
  a.known_pain_risk,
  a.it_portfolio_ref
from raw_enterprise_it.vendors_contracts v
join raw_enterprise_it.applications_portfolio a
  on a._tenant_key = v._tenant_key
 and (
      a.vendor_ref = v.vendor_id
      or position(a.application_id in coalesce(v.supported_application_refs, '')) > 0
    );

create or replace view source.contract_financial_exposure as
select
  v._tenant_key as tenant_key,
  v.contract_id,
  v.vendor_id as vendor_ref,
  v.vendor_name,
  v.annual_value::numeric as contracted_annual_value,
  v.total_committed_value::numeric as total_committed_value,
  v.committed_annual_spend::numeric as committed_annual_spend,
  v.actual_annual_spend::numeric as actual_annual_spend,
  coalesce(sum(b.budget_amount::numeric), 0) as linked_budget_amount,
  coalesce(sum(b.forecast_amount::numeric), 0) as linked_forecast_amount,
  coalesce(sum(b.actual_amount::numeric), 0) as linked_actual_amount,
  coalesce(sum(b.committed_amount::numeric), 0) as linked_committed_amount,
  count(b.budget_line_id) as linked_budget_lines
from raw_enterprise_it.vendors_contracts v
left join raw_enterprise_it.it_budget_allocations b
  on b._tenant_key = v._tenant_key
 and b.contract_ref = v.contract_id
group by v._tenant_key, v.contract_id, v.vendor_id, v.vendor_name, v.annual_value,
  v.total_committed_value, v.committed_annual_spend, v.actual_annual_spend;

create or replace view source.contract_operational_performance as
select
  v._tenant_key as tenant_key,
  v.contract_id,
  v.vendor_id as vendor_ref,
  v.vendor_name,
  v.sla_summary,
  count(distinct a.application_ref) as scoped_application_count,
  count(distinct a.application_ref) filter (where a.criticality in ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')) as critical_application_count,
  sum(tower.parse_num(c.sev1_sev2_incidents)) as cloud_sev1_sev2_incidents,
  avg(tower.parse_num(c.change_failure_rate)) as avg_cloud_change_failure_rate,
  null::numeric as service_credits_earned,
  null::numeric as service_credits_claimed,
  'operational feeds incomplete for contract-specific SLA credits' as evidence_gap
from raw_enterprise_it.vendors_contracts v
left join source.contract_application_scope a
  on a.tenant_key = v._tenant_key
 and a.contract_id = v.contract_id
left join raw_cloud_hybrid.cloud_operations_economics c
  on c._tenant_key = v._tenant_key
 and c.portfolio_ref = a.it_portfolio_ref
group by v._tenant_key, v.contract_id, v.vendor_id, v.vendor_name, v.sla_summary;

create or replace view source.contract_initiative_dependency as
select
  v._tenant_key as tenant_key,
  v.contract_id,
  v.vendor_id as vendor_ref,
  v.vendor_name,
  p.project_id as initiative_ref,
  p.initiative_project_name,
  p.status,
  p.target_end_date::date as target_end_date,
  p.approved_budget::numeric as approved_budget,
  p.expected_business_technology_value,
  p.major_risk_constraint,
  p.decision_needed
from raw_enterprise_it.vendors_contracts v
join raw_enterprise_it.projects_investments p
  on p._tenant_key = v._tenant_key
 and (
      position(v.vendor_name in coalesce(p.key_dependencies, '')) > 0
      or position(v.contract_id in coalesce(p.key_dependencies, '')) > 0
      or p.project_id in (
        select distinct b.project_ref
        from raw_enterprise_it.it_budget_allocations b
        where b._tenant_key = v._tenant_key and b.contract_ref = v.contract_id
      )
    );

create or replace view source.application_vendor_exposure as
select
  a._tenant_key as tenant_key,
  a.application_id as application_ref,
  a.application_platform_name as application_name,
  a.business_criticality as criticality,
  a.lifecycle_status,
  a.hosting_model,
  a.vendor_ref,
  coalesce(v.vendor_name, a.primary_vendor_product) as vendor_name,
  a.annual_run_cost::numeric as annual_run_cost,
  count(distinct s.contract_id) as contract_count,
  sum(v.annual_value::numeric) as contracted_annual_value,
  count(distinct r.risk_id) as risk_count
from raw_enterprise_it.applications_portfolio a
left join raw_enterprise_it.vendors_contracts v
  on v._tenant_key = a._tenant_key
 and v.vendor_id = a.vendor_ref
left join source.contract_application_scope s
  on s.tenant_key = a._tenant_key
 and s.application_ref = a.application_id
left join raw_enterprise_it.risks_controls r
  on r._tenant_key = a._tenant_key
 and position(a.application_id in coalesce(r.affected_application_refs, '')) > 0
group by a._tenant_key, a.application_id, a.application_platform_name, a.business_criticality,
  a.lifecycle_status, a.hosting_model, a.vendor_ref, v.vendor_name, a.primary_vendor_product,
  a.annual_run_cost;

create or replace view source.contract_360 as
select
  c.*,
  coalesce(app.scoped_application_count, 0) as scoped_application_count,
  coalesce(app.critical_application_count, 0) as critical_application_count,
  coalesce(fin.linked_budget_amount, 0) as linked_budget_amount,
  coalesce(fin.linked_actual_amount, 0) as linked_actual_amount,
  coalesce(fin.linked_budget_lines, 0) as linked_budget_lines,
  coalesce(op.cloud_sev1_sev2_incidents, 0) as cloud_sev1_sev2_incidents,
  op.evidence_gap as operational_evidence_gap,
  coalesce(dep.dependency_count, 0) as initiative_dependency_count
from source.contract_vendor_360 c
left join (
  select tenant_key, contract_id, count(distinct application_ref) as scoped_application_count,
    count(distinct application_ref) filter (where criticality in ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')) as critical_application_count
  from source.contract_application_scope
  group by tenant_key, contract_id
) app on app.tenant_key = c.tenant_key and app.contract_id = c.contract_id
left join source.contract_financial_exposure fin
  on fin.tenant_key = c.tenant_key and fin.contract_id = c.contract_id
left join source.contract_operational_performance op
  on op.tenant_key = c.tenant_key and op.contract_id = c.contract_id
left join (
  select tenant_key, contract_id, count(*) as dependency_count
  from source.contract_initiative_dependency
  group by tenant_key, contract_id
) dep on dep.tenant_key = c.tenant_key and dep.contract_id = c.contract_id;

-- ---------------------------------------------------------------------------
-- Tower metric definitions
-- ---------------------------------------------------------------------------

insert into tower.metric_definition (
  metric_ref, domain, label, description, value_type, unit, aggregation_rule,
  directionality, formula_version, freshness_days, required_sample_size, claim_gate_rule
)
values
  ('finance.total_it_budget', 'finance', 'Total IT budget', 'Total IT budget for a fiscal period.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'source_reconciled'),
  ('finance.actual_spend', 'finance', 'Actual spend', 'Actual spend for a fiscal period.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'source_reconciled'),
  ('finance.forecast_spend', 'finance', 'Forecast spend', 'Forecast spend for a fiscal period.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'source_reconciled'),
  ('finance.committed_spend', 'finance', 'Committed spend', 'Committed spend for a fiscal period.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'source_reconciled'),
  ('project.approved_budget', 'project', 'Approved project budget', 'Approved budget for a project or initiative.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'requires_outcome_baseline'),
  ('project.forecast_at_completion', 'project', 'Forecast at completion', 'Forecast-at-completion for a project or initiative.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'requires_outcome_baseline'),
  ('project.actual_to_date', 'project', 'Project actual to date', 'Actual spend to date for a project or initiative.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 370, null, 'requires_outcome_baseline'),
  ('ai.seats_purchased', 'ai', 'AI seats purchased', 'Purchased AI/tool capacity.', 'numeric', 'seats', 'ending_balance', 'neutral', 'tower_formula_v1', 120, null, 'usage_not_value'),
  ('ai.seats_assigned', 'ai', 'AI seats assigned', 'Assigned AI/tool capacity.', 'numeric', 'seats', 'ending_balance', 'neutral', 'tower_formula_v1', 120, null, 'usage_not_value'),
  ('ai.active_users', 'ai', 'AI active users', 'Active users in the period.', 'numeric', 'users', 'ending_balance', 'higher_is_better', 'tower_formula_v1', 120, null, 'usage_not_value'),
  ('ai.active_user_rate', 'ai', 'AI active-user rate', 'Active users divided by assigned seats.', 'numeric', 'ratio', 'ratio', 'higher_is_better', 'tower_formula_v1', 120, null, 'usage_not_value'),
  ('ai.estimated_use_cost', 'ai', 'AI estimated use cost', 'Estimated use cost for the AI/tool record.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 120, null, 'usage_not_value'),
  ('ai.estimated_hours_saved', 'ai', 'Estimated hours saved', 'Estimated hours saved from source usage feed; directional until outcome validated.', 'numeric', 'hours', 'sum', 'higher_is_better', 'tower_formula_v1', 120, null, 'requires_outcome_validation'),
  ('cloud.actual_spend', 'cloud', 'Cloud actual spend', 'Actual cloud spend for the reporting period.', 'numeric', 'usd', 'sum', 'neutral', 'tower_formula_v1', 120, null, 'source_reconciled'),
  ('cloud.idle_waste_estimate', 'cloud', 'Cloud idle/waste estimate', 'Estimated cloud waste in the reporting period.', 'numeric', 'usd', 'sum', 'lower_is_better', 'tower_formula_v1', 120, null, 'requires_finance_validation'),
  ('cloud.sev1_sev2_incidents', 'cloud', 'Cloud Sev1/Sev2 incidents', 'Critical and high-severity incidents for the cloud estate.', 'numeric', 'incidents', 'sum', 'lower_is_better', 'tower_formula_v1', 120, null, 'requires_operational_validation'),
  ('cloud.change_failure_rate', 'cloud', 'Cloud change failure rate', 'Change failure rate for the cloud estate.', 'numeric', 'percent', 'weighted_average', 'lower_is_better', 'tower_formula_v1', 120, null, 'requires_operational_validation'),
  ('value.claimable_amount', 'value', 'Claimable value amount', 'Value that passed deterministic claim gates.', 'numeric', 'usd', 'sum', 'higher_is_better', 'tower_claim_rule_v1', 90, null, 'all_gates_required')
on conflict (metric_ref) do update set
  label = excluded.label,
  description = excluded.description,
  aggregation_rule = excluded.aggregation_rule,
  claim_gate_rule = excluded.claim_gate_rule,
  active = true;

insert into tower.metric_definition (
  metric_ref, domain, label, description, value_type, unit, aggregation_rule,
  directionality, formula_version, freshness_days, required_sample_size, claim_gate_rule
)
select distinct
  'kpi.' || tower.slugify(kpi_id),
  'kpi',
  kpi_name,
  definition,
  'numeric',
  unit,
  case when unit in ('%', 'percent', 'ratio') then 'ratio' else 'non_additive' end,
  case lower(direction) when 'increase' then 'higher_is_better' when 'decrease' then 'lower_is_better' else 'neutral' end,
  'tower_formula_v1',
  120,
  null::numeric,
  'requires_business_attestation'
from raw_enterprise_it.kpis_outcomes
where nullif(kpi_id, '') is not null
on conflict (metric_ref) do update set
  label = excluded.label,
  description = excluded.description,
  unit = excluded.unit,
  aggregation_rule = excluded.aggregation_rule;

-- ---------------------------------------------------------------------------
-- Tower subjects and provenance
-- ---------------------------------------------------------------------------

insert into tower.tracked_subject (subject_ref, tenant_key, subject_kind, title, owner_role, metadata_json)
select distinct
  'SUBJ-ENTERPRISE-IT',
  _tenant_key,
  'initiative',
  'Enterprise IT budget and value portfolio',
  'CIO / IT Finance',
  jsonb_build_object('dataset_id', _dataset_id, 'load_run_id', _load_run_id)
from raw_enterprise_it.it_budget_allocations
on conflict (subject_ref) do update set metadata_json = excluded.metadata_json;

insert into tower.tracked_subject (subject_ref, tenant_key, subject_kind, title, initiative_ref, function_ref, owner_role, launch_date, funding_status, metadata_json)
select distinct
  project_id,
  _tenant_key,
  'initiative',
  initiative_project_name,
  project_id,
  business_function_ref,
  program_project_owner,
  nullif(start_date, '')::date,
  funding_status,
  jsonb_build_object('source_file', _source_file, 'source_row', _source_row_number, 'status', status, 'priority', priority)
from raw_enterprise_it.projects_investments
where nullif(project_id, '') is not null
on conflict (subject_ref) do update set
  title = excluded.title,
  owner_role = excluded.owner_role,
  metadata_json = excluded.metadata_json;

insert into tower.tracked_subject (subject_ref, tenant_key, subject_kind, title, vendor_ref, function_ref, owner_role, metadata_json)
select
  'TOOL-' || tower.slugify(tool_agent_product),
  _tenant_key,
  case
    when max(tool_agent_product) ilike '%ServiceNow%' then 'service_agent'
    when max(tool_agent_product) ilike '%Workday%' then 'hr_agent'
    when bool_or(ai_category ilike '%agent%') then 'service_agent'
    else 'developer_ai_tool'
  end,
  tool_agent_product,
  max(vendor_ref),
  max(business_function_ref),
  max(portfolio_ref),
  jsonb_build_object(
    'vendor_provider', max(vendor_provider),
    'ai_categories', array_agg(distinct ai_category order by ai_category),
    'portfolio_refs', array_agg(distinct portfolio_ref order by portfolio_ref)
  )
from raw_enterprise_it.ai_adoption_usage
where nullif(tool_agent_product, '') is not null
group by _tenant_key, tool_agent_product
on conflict (subject_ref) do update set
  subject_kind = excluded.subject_kind,
  title = excluded.title,
  metadata_json = excluded.metadata_json;

insert into tower.tracked_subject (subject_ref, tenant_key, subject_kind, title, function_ref, metadata_json)
select distinct
  'KPI-' || tower.slugify(kpi_id),
  _tenant_key,
  'workflow',
  kpi_name,
  business_function_ref,
  jsonb_build_object('kpi_type', kpi_type, 'business_outcome', business_outcome)
from raw_enterprise_it.kpis_outcomes
where nullif(kpi_id, '') is not null
on conflict (subject_ref) do update set title = excluded.title, metadata_json = excluded.metadata_json;

insert into tower.tracked_subject (subject_ref, tenant_key, subject_kind, title, contract_ref, vendor_ref, owner_role, launch_date, metadata_json)
select distinct
  contract_id,
  _tenant_key,
  'contract',
  contract_name,
  contract_id,
  vendor_id,
  renewal_owner_ref,
  nullif(start_date, '')::date,
  jsonb_build_object('vendor_name', vendor_name, 'category', category, 'renewal_decision_state', renewal_decision_state)
from raw_enterprise_it.vendors_contracts
where nullif(contract_id, '') is not null
on conflict (subject_ref) do update set title = excluded.title, metadata_json = excluded.metadata_json;

insert into tower.tracked_subject (subject_ref, tenant_key, subject_kind, title, owner_role, metadata_json)
select
  coalesce(nullif(estate_ref, ''), 'CLOUD-' || tower.slugify(estate_provider || '-' || environment_type)),
  _tenant_key,
  'cloud_estate',
  estate_provider,
  max(owner_ref),
  jsonb_build_object(
    'environment_type', environment_type,
    'portfolio_refs', array_agg(distinct portfolio_ref order by portfolio_ref),
    'raw_estate_ref_blank', bool_or(nullif(estate_ref, '') is null)
  )
from raw_cloud_hybrid.cloud_operations_economics
group by _tenant_key, coalesce(nullif(estate_ref, ''), 'CLOUD-' || tower.slugify(estate_provider || '-' || environment_type)), estate_provider, environment_type
on conflict (subject_ref) do update set title = excluded.title, metadata_json = excluded.metadata_json;

insert into tower.metric_provenance (
  provenance_id, tenant_key, source_system, source_report, source_schema, source_table,
  source_file_id, source_row_pointer, formula, formula_version, extraction_method,
  historical_depth, refresh_cadence, last_refreshed, known_limitations, data_owner_role,
  quality_score, attestation_status
)
select distinct
  'prov-' || tower.slugify(source_schema || '-' || source_table),
  tenant_key,
  source_system,
  source_table,
  source_schema,
  source_table,
  source_file_id,
  null,
  formula,
  'tower_formula_v1',
  'raw_sql_promotion',
  historical_depth,
  refresh_cadence,
  now(),
  known_limitations,
  data_owner_role,
  quality_score,
  'not_attested'
from (
  values
    ('raw_enterprise_it', 'it_budget_allocations', 'ERP / FP&A budget extract', 'Raw budget, forecast, actual and committed sums by fiscal year.', 'FY2026-FY2027', 'annual', 'synthetic source; finance signoff required before claimable value', 'IT Finance', 0.92),
    ('raw_enterprise_it', 'ai_adoption_usage', 'AI tool admin exports', 'Raw AI usage and cost fields; hours saved remains directional.', '8 quarters', 'quarterly', 'DORA/productivity and workflow outcome evidence missing', 'Tool admin / IT Finance', 0.78),
    ('raw_enterprise_it', 'kpis_outcomes', 'KPI source files', 'Raw KPI current/prior/target observations.', '8 quarters', 'quarterly', 'Business metric attestation required', 'Business metric owner', 0.74),
    ('raw_enterprise_it', 'projects_investments', 'PMO project portfolio', 'Raw initiative budgets and status.', 'current portfolio', 'monthly', 'Outcome baselines and actual benefits missing', 'PMO / Finance', 0.76),
    ('raw_cloud_hybrid', 'cloud_operations_economics', 'Cloud cost and operations export', 'Raw cloud cost and operations observations.', '8 quarters', 'quarterly', 'Provider billing and ops validation required', 'Cloud platform owner', 0.80)
) s(source_schema, source_table, source_system, formula, historical_depth, refresh_cadence, known_limitations, data_owner_role, quality_score)
cross join lateral (
  select _tenant_key as tenant_key,
    'rawfile-' || md5(s.source_schema || '.' || s.source_table || ':' || coalesce(_source_csv_sha256, 'no-sha')) as source_file_id
  from (
    select _tenant_key, _source_csv_sha256 from raw_enterprise_it.it_budget_allocations where s.source_table = 'it_budget_allocations'
    union all select _tenant_key, _source_csv_sha256 from raw_enterprise_it.ai_adoption_usage where s.source_table = 'ai_adoption_usage'
    union all select _tenant_key, _source_csv_sha256 from raw_enterprise_it.kpis_outcomes where s.source_table = 'kpis_outcomes'
    union all select _tenant_key, _source_csv_sha256 from raw_enterprise_it.projects_investments where s.source_table = 'projects_investments'
    union all select _tenant_key, _source_csv_sha256 from raw_cloud_hybrid.cloud_operations_economics where s.source_table = 'cloud_operations_economics'
  ) q
  limit 1
) q
on conflict (provenance_id) do update set
  source_file_id = excluded.source_file_id,
  known_limitations = excluded.known_limitations,
  quality_score = excluded.quality_score;

-- ---------------------------------------------------------------------------
-- Tower observations
-- ---------------------------------------------------------------------------

insert into tower.metric_observation (
  observation_id, tenant_key, subject_ref, metric_ref, period_start, period_end, scenario,
  value_num, unit, currency, provenance_id, source_result_hash, quality_state, evidence_state
)
select
  'obs-fin-budget-fy' || fiscal_year,
  _tenant_key,
  'SUBJ-ENTERPRISE-IT',
  'finance.total_it_budget',
  tower.period_start(fiscal_year),
  tower.period_end(fiscal_year),
  case when fiscal_year = '2027' then 'target' else 'actual' end,
  sum(budget_amount::numeric),
  'usd',
  'USD',
  'prov-raw-enterprise-it-it-budget-allocations',
  md5(string_agg(_row_sha256, '' order by _source_row_number)),
  'raw_reconciled',
  'source_present'
from raw_enterprise_it.it_budget_allocations
group by _tenant_key, fiscal_year
on conflict (observation_id) do update set value_num = excluded.value_num, source_result_hash = excluded.source_result_hash;

insert into tower.metric_observation (
  observation_id, tenant_key, subject_ref, metric_ref, period_start, period_end, scenario,
  value_num, unit, currency, provenance_id, source_result_hash, quality_state, evidence_state
)
select
  'obs-fin-actual-fy' || fiscal_year,
  _tenant_key,
  'SUBJ-ENTERPRISE-IT',
  'finance.actual_spend',
  tower.period_start(fiscal_year),
  tower.period_end(fiscal_year),
  'actual',
  sum(actual_amount::numeric),
  'usd',
  'USD',
  'prov-raw-enterprise-it-it-budget-allocations',
  md5(string_agg(_row_sha256, '' order by _source_row_number)),
  'raw_reconciled',
  'source_present'
from raw_enterprise_it.it_budget_allocations
group by _tenant_key, fiscal_year
on conflict (observation_id) do update set value_num = excluded.value_num, source_result_hash = excluded.source_result_hash;

insert into tower.metric_observation (
  observation_id, tenant_key, subject_ref, metric_ref, period_start, period_end, scenario,
  value_num, unit, currency, provenance_id, source_result_hash, quality_state, evidence_state
)
select
  'obs-ai-' || tower.slugify(ai_adoption_id || '-' || metric_ref),
  _tenant_key,
  'TOOL-' || tower.slugify(tool_agent_product),
  metric_ref,
  tower.period_start(reporting_period),
  tower.period_end(reporting_period),
  'actual',
  value_num,
  unit,
  case when unit = 'usd' then 'USD' else null end,
  'prov-raw-enterprise-it-ai-adoption-usage',
  _row_sha256,
  'raw_promoted',
  'usage_present'
from (
  select *, 'ai.seats_purchased' as metric_ref, tower.parse_num(seats_purchased) as value_num, 'seats' as unit from raw_enterprise_it.ai_adoption_usage
  union all select *, 'ai.seats_assigned', tower.parse_num(seats_assigned), 'seats' from raw_enterprise_it.ai_adoption_usage
  union all select *, 'ai.active_users', tower.parse_num(active_users), 'users' from raw_enterprise_it.ai_adoption_usage
  union all select *, 'ai.active_user_rate',
    case when tower.parse_num(seats_assigned) > 0 then tower.parse_num(active_users) / tower.parse_num(seats_assigned) else null end, 'ratio'
    from raw_enterprise_it.ai_adoption_usage
  union all select *, 'ai.estimated_use_cost', tower.parse_num(estimated_use_cost), 'usd' from raw_enterprise_it.ai_adoption_usage
  union all select *, 'ai.estimated_hours_saved', tower.parse_num(estimated_hours_saved), 'hours' from raw_enterprise_it.ai_adoption_usage
) x
where value_num is not null and tower.period_start(reporting_period) is not null
on conflict (observation_id) do update set value_num = excluded.value_num, source_result_hash = excluded.source_result_hash;

insert into tower.metric_observation (
  observation_id, tenant_key, subject_ref, metric_ref, period_start, period_end, scenario,
  value_num, unit, provenance_id, source_result_hash, quality_state, evidence_state
)
select
  'obs-kpi-' || tower.slugify(kpi_observation_id || '-' || scenario),
  _tenant_key,
  'KPI-' || tower.slugify(kpi_id),
  'kpi.' || tower.slugify(kpi_id),
  tower.period_start(reporting_period),
  tower.period_end(reporting_period),
  scenario,
  value_num,
  unit,
  'prov-raw-enterprise-it-kpis-outcomes',
  _row_sha256,
  'raw_promoted',
  'business_metric_present'
from (
  select *, 'actual' as scenario, tower.parse_num(current_value) as value_num from raw_enterprise_it.kpis_outcomes
  union all select *, 'baseline', tower.parse_num(prior_value) from raw_enterprise_it.kpis_outcomes
  union all select *, 'target', tower.parse_num(target_value) from raw_enterprise_it.kpis_outcomes
) k
where value_num is not null and tower.period_start(reporting_period) is not null
on conflict (observation_id) do update set value_num = excluded.value_num, source_result_hash = excluded.source_result_hash;

insert into tower.metric_observation (
  observation_id, tenant_key, subject_ref, metric_ref, period_start, period_end, scenario,
  value_num, unit, currency, provenance_id, source_result_hash, quality_state, evidence_state
)
select
  'obs-project-' || tower.slugify(project_id || '-' || metric_ref),
  _tenant_key,
  project_id,
  metric_ref,
  coalesce(nullif(start_date, '')::date, make_date(2026, 1, 1)),
  coalesce(nullif(target_end_date, '')::date, make_date(2027, 12, 31)),
  'actual',
  value_num,
  'usd',
  'USD',
  'prov-raw-enterprise-it-projects-investments',
  _row_sha256,
  'raw_promoted',
  'funding_present'
from (
  select *, 'project.approved_budget' as metric_ref, tower.parse_num(approved_budget) as value_num from raw_enterprise_it.projects_investments
  union all select *, 'project.forecast_at_completion', tower.parse_num(forecast_at_completion) from raw_enterprise_it.projects_investments
  union all select *, 'project.actual_to_date', tower.parse_num(actual_to_date) from raw_enterprise_it.projects_investments
) p
where value_num is not null and nullif(project_id, '') is not null
on conflict (observation_id) do update set value_num = excluded.value_num, source_result_hash = excluded.source_result_hash;

insert into tower.metric_observation (
  observation_id, tenant_key, subject_ref, metric_ref, period_start, period_end, scenario,
  value_num, unit, currency, provenance_id, source_result_hash, quality_state, evidence_state
)
select
  'obs-cloud-' || tower.slugify("6_cloud_operations_economics_id" || '-' || metric_ref),
  _tenant_key,
  coalesce(nullif(estate_ref, ''), 'CLOUD-' || tower.slugify(estate_provider || '-' || environment_type)),
  metric_ref,
  tower.period_start(reporting_period),
  tower.period_end(reporting_period),
  'actual',
  value_num,
  unit,
  case when unit = 'usd' then 'USD' else null end,
  'prov-raw-cloud-hybrid-cloud-operations-economics',
  _row_sha256,
  'raw_promoted',
  'operational_metric_present'
from (
  select *, 'cloud.actual_spend' as metric_ref, tower.parse_num(actual_spend) as value_num, 'usd' as unit from raw_cloud_hybrid.cloud_operations_economics
  union all select *, 'cloud.idle_waste_estimate', tower.parse_num(idle_waste_estimate), 'usd' from raw_cloud_hybrid.cloud_operations_economics
  union all select *, 'cloud.sev1_sev2_incidents', tower.parse_num(sev1_sev2_incidents), 'incidents' from raw_cloud_hybrid.cloud_operations_economics
  union all select *, 'cloud.change_failure_rate', tower.parse_num(change_failure_rate), 'percent' from raw_cloud_hybrid.cloud_operations_economics
) c
where value_num is not null and tower.period_start(reporting_period) is not null
on conflict (observation_id) do update set value_num = excluded.value_num, source_result_hash = excluded.source_result_hash;

-- ---------------------------------------------------------------------------
-- Tower value claims: synthetic proof maturity, not fabricated claimability.
-- ---------------------------------------------------------------------------

with project_kpis as (
  select
    _tenant_key,
    related_initiative_ref as project_id,
    kpi_id,
    kpi_observation_id,
    confidence,
    source_system_file,
    direction,
    current_value,
    prior_value,
    target_value,
    reporting_period,
    _row_sha256,
    tower.parse_num(prior_value) as baseline_num,
    tower.parse_num(current_value) as actual_num,
    tower.parse_num(target_value) as target_num
  from raw_enterprise_it.kpis_outcomes
  where nullif(related_initiative_ref, '') is not null
),
project_kpi_rollup as (
  select
    _tenant_key,
    project_id,
    count(*)::int as kpi_count,
    bool_or(lower(coalesce(confidence, '')) = 'disputed') as has_disputed,
    bool_or(
      lower(coalesce(confidence, '')) in ('high', 'medium')
      and lower(coalesce(source_system_file, '')) in ('finance mart', 'bi semantic layer')
    ) as has_finance_metric,
    bool_or(lower(coalesce(confidence, '')) in ('high', 'medium')) as has_supported_metric,
    md5(string_agg(coalesce(_row_sha256, ''), '' order by coalesce(kpi_observation_id, kpi_id))) as kpi_hash
  from project_kpis
  group by _tenant_key, project_id
),
selected_kpi as (
  select distinct on (_tenant_key, project_id)
    *,
    case
      when baseline_num is null or actual_num is null or target_num is null then null::numeric
      when lower(coalesce(direction, '')) = 'decrease' and baseline_num <> target_num
        then least(1::numeric, greatest(0::numeric, (baseline_num - actual_num) / nullif(baseline_num - target_num, 0)))
      when baseline_num <> target_num
        then least(1::numeric, greatest(0::numeric, (actual_num - baseline_num) / nullif(target_num - baseline_num, 0)))
      else null::numeric
    end as progress_ratio
  from project_kpis
  order by
    _tenant_key,
    project_id,
    case
      when lower(coalesce(confidence, '')) in ('high', 'medium')
       and lower(coalesce(source_system_file, '')) in ('finance mart', 'bi semantic layer') then 0
      when lower(coalesce(confidence, '')) in ('high', 'medium') then 1
      when lower(coalesce(confidence, '')) = 'disputed' then 2
      else 3
    end,
    tower.period_end(reporting_period) desc nulls last,
    kpi_observation_id
),
project_claim_basis as (
  select
    p.*,
    coalesce(r.kpi_count, 0) as kpi_count,
    coalesce(r.has_disputed, false) as has_disputed,
    coalesce(r.has_finance_metric, false) as has_finance_metric,
    coalesce(r.has_supported_metric, false) as has_supported_metric,
    r.kpi_hash,
    s.kpi_id,
    s.kpi_observation_id,
    s.progress_ratio,
    s.baseline_num,
    s.actual_num,
    s.target_num,
    case
      when coalesce(r.kpi_count, 0) = 0 then 'funded_no_baseline'
      when coalesce(r.has_disputed, false) then 'disputed'
      when coalesce(r.has_finance_metric, false) then 'finance_validated'
      when coalesce(r.has_supported_metric, false) then 'usage_supported'
      else 'baseline_captured'
    end as derived_claim_state
  from raw_enterprise_it.projects_investments p
  left join project_kpi_rollup r
    on r._tenant_key = p._tenant_key
   and r.project_id = p.project_id
  left join selected_kpi s
    on s._tenant_key = p._tenant_key
   and s.project_id = p.project_id
  where nullif(p.project_id, '') is not null
)
insert into tower.value_claim (
  claim_id, tenant_key, subject_ref, outcome_metric_ref,
  baseline_observation_id, target_observation_id, actual_observation_id,
  promised_value, calculated_value, currency, attribution_basis,
  quality_guardrail_state, risk_guardrail_state, claim_state,
  claim_rule_version, claim_input_hash, caveat, blocked_reason, next_gate, next_gate_owner_role
)
select
  'claim-project-' || project_id,
  _tenant_key,
  project_id,
  case when nullif(kpi_id, '') is not null then 'kpi.' || tower.slugify(kpi_id) else 'value.claimable_amount' end,
  case when baseline_num is not null then 'obs-kpi-' || tower.slugify(kpi_observation_id || '-baseline') end,
  case when target_num is not null then 'obs-kpi-' || tower.slugify(kpi_observation_id || '-target') end,
  case when actual_num is not null then 'obs-kpi-' || tower.slugify(kpi_observation_id || '-actual') end,
  coalesce(
    tower.parse_num(expected_business_technology_value),
    tower.parse_num(approved_budget)
  ),
  case
    when derived_claim_state = 'finance_validated'
     and progress_ratio is not null
     and tower.parse_num(approved_budget) is not null
      then round(tower.parse_num(approved_budget) * progress_ratio * 0.35, 2)
    else null
  end,
  'USD',
  case derived_claim_state
    when 'finance_validated' then 'baseline/current/target KPI evidence is present from a finance or governed BI source; value remains partial until attested.'
    when 'usage_supported' then 'baseline/current/target KPI evidence is present, but finance validation is not complete.'
    when 'baseline_captured' then 'baseline/current/target KPI evidence is present, but source confidence is still estimated.'
    when 'disputed' then 'baseline/current/target KPI evidence exists, but at least one linked KPI is disputed.'
    else 'project funding exists, but no linked KPI baseline/current/target evidence is loaded.'
  end || ' Promised value basis is numeric expected value when present; otherwise approved budget is used as investment-at-stake.',
  case derived_claim_state
    when 'finance_validated' then 'finance_validated'
    when 'disputed' then 'disputed'
    when 'funded_no_baseline' then 'not_evaluated'
    else 'business_metric_present'
  end,
  case derived_claim_state
    when 'finance_validated' then 'business_validated'
    when 'disputed' then 'risk_review_required'
    when 'funded_no_baseline' then 'not_evaluated'
    else 'outcome_metric_present'
  end,
  derived_claim_state,
  'tower_claim_rule_v2',
  md5(concat_ws(':', coalesce(_row_sha256, ''), coalesce(kpi_hash, ''), derived_claim_state, coalesce(kpi_observation_id, ''))),
  case derived_claim_state
    when 'finance_validated' then 'Synthetic partial value is formula-derived from linked KPI progress and approved budget. It is not claimable until Finance and business attestations pass.'
    when 'usage_supported' then 'Outcome movement is visible, but Finance validation and attestations are incomplete.'
    when 'baseline_captured' then 'Comparable measurement evidence exists, but confidence and attestation gates remain open.'
    when 'disputed' then 'Linked KPI evidence is disputed; Tower withholds the value from executive claimable totals.'
    else 'Project has funding data, but no linked outcome baseline/current/target evidence.'
  end || case
    when tower.parse_num(expected_business_technology_value) is null and tower.parse_num(approved_budget) is not null
      then ' The source value hypothesis is qualitative, so Tower uses approved budget as value-at-stake rather than fabricated promised value.'
    else ''
  end,
  case derived_claim_state
    when 'finance_validated' then 'Awaiting Finance and business attestation before claimability.'
    when 'usage_supported' then 'Missing Finance validation and business/finance attestation.'
    when 'baseline_captured' then 'Missing accepted outcome confidence, attribution, and attestation.'
    when 'disputed' then 'Resolve disputed KPI evidence before any value decision.'
    else 'Missing governed baseline/current/target KPI evidence and attestation.'
  end,
  case derived_claim_state
    when 'finance_validated' then 'Obtain Finance and business attestation.'
    when 'usage_supported' then 'Validate attribution and Finance value method.'
    when 'baseline_captured' then 'Instrument and validate outcome movement.'
    when 'disputed' then 'Reconcile disputed metric evidence.'
    else 'Capture comparable baseline/current/target outcome metrics.'
  end,
  coalesce(business_sponsor_ref, it_portfolio_ref, 'PMO / Finance')
from project_claim_basis
on conflict (claim_id) do update set
  subject_ref = excluded.subject_ref,
  outcome_metric_ref = excluded.outcome_metric_ref,
  baseline_observation_id = excluded.baseline_observation_id,
  target_observation_id = excluded.target_observation_id,
  actual_observation_id = excluded.actual_observation_id,
  promised_value = excluded.promised_value,
  calculated_value = excluded.calculated_value,
  currency = excluded.currency,
  attribution_basis = excluded.attribution_basis,
  quality_guardrail_state = excluded.quality_guardrail_state,
  risk_guardrail_state = excluded.risk_guardrail_state,
  claim_state = excluded.claim_state,
  claim_rule_version = excluded.claim_rule_version,
  claim_input_hash = excluded.claim_input_hash,
  caveat = excluded.caveat,
  blocked_reason = excluded.blocked_reason,
  next_gate = excluded.next_gate,
  next_gate_owner_role = excluded.next_gate_owner_role,
  evaluated_at = now(),
  stale_at = null,
  stale_reason = null;

insert into tower.value_claim (
  claim_id, tenant_key, subject_ref, outcome_metric_ref, promised_value, calculated_value,
  currency, attribution_basis, quality_guardrail_state, risk_guardrail_state, claim_state,
  claim_rule_version, claim_input_hash, caveat, blocked_reason, next_gate, next_gate_owner_role
)
select
  'claim-ai-tool-' || tower.slugify(tool_agent_product),
  _tenant_key,
  'TOOL-' || tower.slugify(tool_agent_product),
  'value.claimable_amount',
  null,
  null,
  'USD',
  'AI usage and cost are present; outcome attribution requires DORA/productivity or workflow before/after evidence.',
  'usage_evidence_present',
  'outcome_validation_required',
  case when sum(tower.parse_num(active_users)) > 0 then 'usage_supported' else 'funded_no_baseline' end,
  'tower_claim_rule_v2',
  md5(string_agg(coalesce(_row_sha256, ''), '' order by _source_row_number)),
  'Usage is visible, but claimable value is blocked until outcome, quality/risk guardrails, and attestations are complete.',
  'Missing DORA/productivity or ServiceNow/Workday workflow outcome evidence and finance/business attestation.',
  'Load before/after outcome metrics and attestations.',
  max(coalesce(portfolio_ref, 'Tool owner / Finance'))
from raw_enterprise_it.ai_adoption_usage
where nullif(tool_agent_product, '') is not null
group by _tenant_key, tool_agent_product
on conflict (claim_id) do update set
  subject_ref = excluded.subject_ref,
  outcome_metric_ref = excluded.outcome_metric_ref,
  promised_value = excluded.promised_value,
  calculated_value = excluded.calculated_value,
  currency = excluded.currency,
  attribution_basis = excluded.attribution_basis,
  quality_guardrail_state = excluded.quality_guardrail_state,
  risk_guardrail_state = excluded.risk_guardrail_state,
  claim_state = excluded.claim_state,
  claim_rule_version = excluded.claim_rule_version,
  claim_input_hash = excluded.claim_input_hash,
  caveat = excluded.caveat,
  blocked_reason = excluded.blocked_reason,
  next_gate = excluded.next_gate,
  next_gate_owner_role = excluded.next_gate_owner_role,
  evaluated_at = now(),
  stale_at = null,
  stale_reason = null;
