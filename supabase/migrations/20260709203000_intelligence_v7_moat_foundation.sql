create schema if not exists intelligence_v7;

create table if not exists intelligence_v7.active_tenant_contract_versions (
  tenant_key text primary key,
  active_contract_version text not null,
  candidate_contract_version text,
  rollback_contract_version text,
  promotion_status text not null default 'active'
    check (promotion_status in ('candidate', 'active', 'rolled_back', 'blocked')),
  promoted_by text not null default 'system',
  promoted_at timestamptz not null default now(),
  proof_bundle_uri text,
  promotion_notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists intelligence_v7.tenant_contract_promotion_events (
  event_key text primary key,
  tenant_key text not null,
  from_contract_version text,
  to_contract_version text not null,
  event_type text not null
    check (event_type in ('promote', 'rollback', 'block', 'validate')),
  promotion_status text not null
    check (promotion_status in ('passed', 'failed', 'blocked')),
  actor text not null default 'system',
  reason text not null default '',
  proof_bundle_uri text,
  validation_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists intelligence_v7.module_readiness_scores (
  readiness_key text primary key,
  tenant_key text not null,
  contract_version text not null,
  module_key text not null
    check (module_key in ('home', 'intelligence', 'moves', 'source', 'tower', 'export')),
  readiness_status text not null
    check (readiness_status in ('ready', 'partial', 'blocked')),
  readiness_score numeric(5,2) not null
    check (readiness_score >= 0 and readiness_score <= 100),
  required_dimensions jsonb not null default '[]'::jsonb,
  present_dimensions jsonb not null default '[]'::jsonb,
  missing_dimensions jsonb not null default '[]'::jsonb,
  source_coverage_score numeric(5,2) not null default 0
    check (source_coverage_score >= 0 and source_coverage_score <= 100),
  fact_coverage_score numeric(5,2) not null default 0
    check (fact_coverage_score >= 0 and fact_coverage_score <= 100),
  relationship_coverage_score numeric(5,2) not null default 0
    check (relationship_coverage_score >= 0 and relationship_coverage_score <= 100),
  retrieval_coverage_score numeric(5,2) not null default 0
    check (retrieval_coverage_score >= 0 and retrieval_coverage_score <= 100),
  unsupported_claim_risk text not null default 'medium'
    check (unsupported_claim_risk in ('low', 'medium', 'high')),
  blockers jsonb not null default '[]'::jsonb,
  proof_refs jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, contract_version, module_key)
);

create table if not exists intelligence_v7.derived_intelligence_quality_reports (
  report_key text primary key,
  tenant_key text not null,
  contract_version text not null,
  derived_ref text not null,
  module_key text not null,
  gate_status text not null
    check (gate_status in ('passed', 'data_thin', 'not_ready', 'blocked')),
  confidence text not null default 'unknown'
    check (confidence in ('high', 'medium', 'low', 'unknown')),
  source_fact_refs jsonb not null default '[]'::jsonb,
  graph_relationship_refs jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  evidence_gaps jsonb not null default '[]'::jsonb,
  not_allowed_claims jsonb not null default '[]'::jsonb,
  derivation_reason text not null default '',
  blocked_reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_key, contract_version, derived_ref)
);

create table if not exists intelligence_v7.existing_tenant_upgrade_snapshots (
  snapshot_key text primary key,
  tenant_key text not null,
  source_contract_version text not null,
  target_contract_version text,
  snapshot_status text not null default 'captured'
    check (snapshot_status in ('captured', 'mapped', 'candidate_loaded', 'proof_passed', 'promoted', 'blocked')),
  loaded_source_files jsonb not null default '[]'::jsonb,
  current_answer_behavior jsonb not null default '{}'::jsonb,
  mapping_report jsonb not null default '{}'::jsonb,
  quality_report jsonb not null default '{}'::jsonb,
  before_after_report jsonb not null default '{}'::jsonb,
  proof_matrix jsonb not null default '{}'::jsonb,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_intelligence_v7_upgrade_snapshots_unique
  on intelligence_v7.existing_tenant_upgrade_snapshots(tenant_key, source_contract_version, coalesce(target_contract_version, 'none'));

do $$
begin
  if to_regclass('intelligence_v7.business_records') is not null then
    alter table intelligence_v7.business_records
      add column if not exists fact_status text not null default 'active'
        check (fact_status in ('active', 'stale', 'superseded', 'retired', 'rejected'));
    alter table intelligence_v7.business_records
      add column if not exists valid_from timestamptz;
    alter table intelligence_v7.business_records
      add column if not exists valid_to timestamptz;
    alter table intelligence_v7.business_records
      add column if not exists stale_after date;
    alter table intelligence_v7.business_records
      add column if not exists superseded_by text;
    alter table intelligence_v7.business_records
      add column if not exists fact_confidence text not null default 'unknown'
        check (fact_confidence in ('high', 'medium', 'low', 'unknown'));

    create index if not exists idx_intelligence_v7_records_fact_status
      on intelligence_v7.business_records(tenant_key, contract_version, fact_status);
    create index if not exists idx_intelligence_v7_records_stale_after
      on intelligence_v7.business_records(tenant_key, stale_after);
  end if;
end $$;

do $$
begin
  if to_regclass('intelligence_v7.tenant_pack_runs') is not null then
    insert into intelligence_v7.active_tenant_contract_versions (
      tenant_key,
      active_contract_version,
      rollback_contract_version,
      promotion_status,
      promoted_by,
      promoted_at,
      promotion_notes,
      metadata
    )
    select distinct on (tenant_key)
      tenant_key,
      contract_version,
      null::text,
      'active',
      'migration-backfill',
      loaded_at,
      'Backfilled from latest loaded or validated non-superseded tenant pack run.',
      jsonb_build_object('source_run_key', run_key, 'source_dataset', source_dataset)
    from intelligence_v7.tenant_pack_runs
    where load_status in ('loaded', 'validated')
      and superseded_at is null
    order by tenant_key, loaded_at desc
    on conflict (tenant_key) do nothing;

    create or replace view intelligence_v7.current_tenant_pack_runs as
      select run.*
      from intelligence_v7.tenant_pack_runs run
      join intelligence_v7.active_tenant_contract_versions active
        on active.tenant_key = run.tenant_key
       and active.active_contract_version = run.contract_version
      where active.promotion_status = 'active'
        and run.load_status in ('loaded', 'validated')
        and run.superseded_at is null;
  end if;

  if to_regclass('intelligence_v7.tenant_pack_runs') is not null
     and to_regclass('intelligence_v7.business_records') is not null then
    create or replace view intelligence_v7.current_business_records as
      select r.*
      from intelligence_v7.business_records r
      join intelligence_v7.current_tenant_pack_runs run
        on run.run_key = r.run_key
      where coalesce(r.fact_status, 'active') = 'active';
  end if;
end $$;

create index if not exists idx_intelligence_v7_active_contract_status
  on intelligence_v7.active_tenant_contract_versions(promotion_status, promoted_at desc);
create index if not exists idx_intelligence_v7_promotion_events_tenant_created
  on intelligence_v7.tenant_contract_promotion_events(tenant_key, created_at desc);
create index if not exists idx_intelligence_v7_module_readiness_tenant_contract
  on intelligence_v7.module_readiness_scores(tenant_key, contract_version, module_key);
create index if not exists idx_intelligence_v7_quality_reports_status
  on intelligence_v7.derived_intelligence_quality_reports(tenant_key, contract_version, gate_status);
create index if not exists idx_intelligence_v7_upgrade_snapshots_tenant
  on intelligence_v7.existing_tenant_upgrade_snapshots(tenant_key, created_at desc);

alter table intelligence_v7.active_tenant_contract_versions enable row level security;
alter table intelligence_v7.tenant_contract_promotion_events enable row level security;
alter table intelligence_v7.module_readiness_scores enable row level security;
alter table intelligence_v7.derived_intelligence_quality_reports enable row level security;
alter table intelligence_v7.existing_tenant_upgrade_snapshots enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'active_tenant_contract_versions',
    'tenant_contract_promotion_events',
    'module_readiness_scores',
    'derived_intelligence_quality_reports',
    'existing_tenant_upgrade_snapshots'
  ]
  loop
    execute format('drop policy if exists intelligence_v7_moat_tenant_select on intelligence_v7.%I', table_name);
    execute format(
      'create policy intelligence_v7_moat_tenant_select on intelligence_v7.%I for select using (
        tenant_key = current_setting(''app.tenant_key'', true)
        or tenant_key = current_setting(''app.client_key'', true)
        or current_setting(''app.tenant_key'', true) = ''internal-admin''
        or current_setting(''app.client_key'', true) = ''internal-admin''
      )',
      table_name
    );
  end loop;
end $$;

grant usage on schema intelligence_v7 to authenticated, service_role;
grant select on intelligence_v7.active_tenant_contract_versions to authenticated;
grant select on intelligence_v7.tenant_contract_promotion_events to authenticated;
grant select on intelligence_v7.module_readiness_scores to authenticated;
grant select on intelligence_v7.derived_intelligence_quality_reports to authenticated;
grant select on intelligence_v7.existing_tenant_upgrade_snapshots to authenticated;
grant select, insert, update, delete on intelligence_v7.active_tenant_contract_versions to service_role;
grant select, insert, update, delete on intelligence_v7.tenant_contract_promotion_events to service_role;
grant select, insert, update, delete on intelligence_v7.module_readiness_scores to service_role;
grant select, insert, update, delete on intelligence_v7.derived_intelligence_quality_reports to service_role;
grant select, insert, update, delete on intelligence_v7.existing_tenant_upgrade_snapshots to service_role;

comment on table intelligence_v7.active_tenant_contract_versions is
  'Governed per-tenant active/candidate V7 contract pointer. Runtime readers must use this instead of choosing newest loaded data.';
comment on table intelligence_v7.module_readiness_scores is
  'Deterministic per-module readiness scores for Home, Intelligence, Moves, Source, Tower, and Export over a tenant contract version.';
comment on table intelligence_v7.derived_intelligence_quality_reports is
  'No-fake-intelligence gate results proving derived rows are grounded in tenant facts, graph relationships, assumptions, and explicit gaps.';
comment on table intelligence_v7.existing_tenant_upgrade_snapshots is
  'Versioned migration/backfill audit snapshots for upgrading existing tenants without deleting or silently overwriting prior contract versions.';
