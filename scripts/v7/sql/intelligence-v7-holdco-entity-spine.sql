-- AbarVa V7.1 holdco entity-spine extension.
--
-- Purpose:
-- Make holding-company / portfolio-company hierarchy first-class in Azure
-- Postgres before V7.1 Lakeshore reload. The existing V7 loader stores
-- entity_id in values_json; these additive columns and views promote that
-- stable ID into queryable/read-model shape without breaking V7.0 payloads.

create schema if not exists intelligence_v7;

alter table intelligence_v7.business_records
  add column if not exists entity_id text,
  add column if not exists parent_entity_id text,
  add column if not exists entity_type text;

alter table intelligence_v7.graph_nodes
  add column if not exists entity_id text,
  add column if not exists parent_entity_id text;

alter table intelligence_v7.chunk_registry
  add column if not exists entity_id text;

update intelligence_v7.business_records
set
  entity_id = coalesce(nullif(entity_id, ''), nullif(values_json->>'entity_id', '')),
  parent_entity_id = coalesce(nullif(parent_entity_id, ''), nullif(values_json->>'parent_entity_id', '')),
  entity_type = coalesce(nullif(entity_type, ''), nullif(values_json->>'entity_type', ''), nullif(values_json->>'legal_entity_type', ''))
where contract_version like 'v7.%'
  and (entity_id is null or parent_entity_id is null or entity_type is null);

update intelligence_v7.graph_nodes
set
  entity_id = coalesce(nullif(entity_id, ''), nullif(values_json->>'entity_id', '')),
  parent_entity_id = coalesce(nullif(parent_entity_id, ''), nullif(values_json->>'parent_entity_id', ''))
where contract_version like 'v7.%'
  and (entity_id is null or parent_entity_id is null);

update intelligence_v7.chunk_registry
set entity_id = coalesce(nullif(entity_id, ''), nullif(values_json->>'entity_id', ''), nullif(entity_refs, ''))
where contract_version like 'v7.%'
  and entity_id is null;

create table if not exists intelligence_v7.entity_registry (
  entity_registry_key text primary key,
  tenant_key text not null,
  contract_version text not null,
  entity_id text not null,
  entity_name text not null,
  entity_short_name text,
  entity_type text not null,
  entity_scope text not null,
  parent_entity_id text,
  parent_entity_name text,
  revenue_usd numeric,
  employee_count integer,
  total_direct_technology_budget_usd numeric,
  ai_data_budget_usd numeric,
  headquarters text,
  industry text,
  sub_industry text,
  cxo_sponsor text,
  finance_sponsor text,
  innovation_sponsor text,
  source_record_key text,
  values_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_key, contract_version, entity_id)
);

insert into intelligence_v7.entity_registry (
  entity_registry_key,
  tenant_key,
  contract_version,
  entity_id,
  entity_name,
  entity_short_name,
  entity_type,
  entity_scope,
  parent_entity_id,
  parent_entity_name,
  revenue_usd,
  employee_count,
  total_direct_technology_budget_usd,
  ai_data_budget_usd,
  headquarters,
  industry,
  sub_industry,
  cxo_sponsor,
  finance_sponsor,
  innovation_sponsor,
  source_record_key,
  values_json
)
select
  concat_ws(':', 'entity', tenant_key, contract_version, values_json->>'entity_id') as entity_registry_key,
  tenant_key,
  contract_version,
  values_json->>'entity_id' as entity_id,
  coalesce(nullif(values_json->>'entity_name', ''), entity_name) as entity_name,
  values_json->>'entity_short_name' as entity_short_name,
  coalesce(nullif(values_json->>'entity_type', ''), nullif(values_json->>'legal_entity_type', ''), 'unknown') as entity_type,
  coalesce(nullif(values_json->>'entity_scope', ''), entity_scope, 'unknown') as entity_scope,
  nullif(values_json->>'parent_entity_id', '') as parent_entity_id,
  coalesce(nullif(values_json->>'parent_entity_name', ''), parent_entity_name) as parent_entity_name,
  nullif(values_json->>'revenue_usd', '')::numeric as revenue_usd,
  nullif(values_json->>'employee_count', '')::integer as employee_count,
  nullif(values_json->>'total_direct_technology_budget_usd', '')::numeric as total_direct_technology_budget_usd,
  nullif(values_json->>'ai_data_budget_usd', '')::numeric as ai_data_budget_usd,
  values_json->>'headquarters' as headquarters,
  values_json->>'industry' as industry,
  values_json->>'sub_industry' as sub_industry,
  values_json->>'cxo_sponsor' as cxo_sponsor,
  values_json->>'finance_sponsor' as finance_sponsor,
  values_json->>'innovation_sponsor' as innovation_sponsor,
  record_key,
  values_json
from intelligence_v7.business_records
where dimension_key = 'v7_00_portfolio_entity_registry'
  and nullif(values_json->>'entity_id', '') is not null
on conflict (tenant_key, contract_version, entity_id) do update set
  entity_name = excluded.entity_name,
  entity_short_name = excluded.entity_short_name,
  entity_type = excluded.entity_type,
  entity_scope = excluded.entity_scope,
  parent_entity_id = excluded.parent_entity_id,
  parent_entity_name = excluded.parent_entity_name,
  revenue_usd = excluded.revenue_usd,
  employee_count = excluded.employee_count,
  total_direct_technology_budget_usd = excluded.total_direct_technology_budget_usd,
  ai_data_budget_usd = excluded.ai_data_budget_usd,
  headquarters = excluded.headquarters,
  industry = excluded.industry,
  sub_industry = excluded.sub_industry,
  cxo_sponsor = excluded.cxo_sponsor,
  finance_sponsor = excluded.finance_sponsor,
  innovation_sponsor = excluded.innovation_sponsor,
  source_record_key = excluded.source_record_key,
  values_json = excluded.values_json,
  updated_at = now();

create index if not exists idx_intelligence_v7_records_entity
  on intelligence_v7.business_records(tenant_key, contract_version, entity_id, dimension_key);

create index if not exists idx_intelligence_v7_entity_registry_parent
  on intelligence_v7.entity_registry(tenant_key, contract_version, parent_entity_id);

create or replace view intelligence_v7.current_entity_registry as
select e.*
from intelligence_v7.entity_registry e
join intelligence_v7.current_tenant_pack_runs run
  on run.tenant_key = e.tenant_key
 and run.contract_version = e.contract_version;

create or replace view intelligence_v7.entity_dimension_coverage as
select
  r.tenant_key,
  r.contract_version,
  r.entity_id,
  coalesce(e.entity_name, r.entity_name) as entity_name,
  r.dimension_key,
  count(*)::int as record_count
from intelligence_v7.business_records r
left join intelligence_v7.entity_registry e
  on e.tenant_key = r.tenant_key
 and e.contract_version = r.contract_version
 and e.entity_id = r.entity_id
where r.entity_id is not null
group by r.tenant_key, r.contract_version, r.entity_id, coalesce(e.entity_name, r.entity_name), r.dimension_key;
