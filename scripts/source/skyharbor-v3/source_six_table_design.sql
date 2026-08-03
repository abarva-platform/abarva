-- SkyHarbor Source Postgres six-table design.
-- Planning artifact only. Do not apply until corpus package and migration are approved.
--
-- Six universal physical tables:
--   1. doc.file
--   2. doc.page
--   3. doc.span
--   4. meta.concept
--   5. meta.concept_map
--   6. doc.extraction
--
-- Per-client raw upload tables remain 1:1 landing tables:
--   raw_<tenant>.<whatever_they_sent>
--
-- Everything analytical is a view, except reconciled money marts when approved.
-- This revision hardens the six-table direction without adding typed contract tables:
--   - duplicate document bytes are indexed, not blocked
--   - tenant-aware foreign keys guard every lineage reference
--   - every extraction records map/extractor/model/prompt lineage
--   - semantic wide views read only resolved extraction facts
--   - embeddings are deferred until pgvector is explicitly enabled

create schema if not exists doc;
create schema if not exists meta;
create schema if not exists sem;
create schema if not exists mart;

create table if not exists doc.file (
  file_id text primary key,
  tenant_key text not null,
  blob_uri text not null,
  content_sha256 text not null,
  file_name text,
  media_type text,
  page_count int,
  load_run_id text not null,
  source_event_id text,
  document_role text,             -- framework | sow | change_order | amendment | dpa | exhibit | notice | raw_export
  document_type text,
  contract_ref text,              -- declared raw CTR-* or client contract id
  sow_ref text,
  parent_file_id text,
  duplicate_of_file_id text,
  duplicate_state text,           -- original | duplicate | derivative | not_checked
  effective_date date,
  expiry_date date,
  visibility_class text not null default 'internal',
  content_authenticity text not null,
  uploaded_at timestamptz default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  unique (tenant_key, file_id),
  constraint doc_file_duplicate_state_check check (
    duplicate_state is null or duplicate_state in ('original', 'duplicate', 'derivative', 'not_checked')
  ),
  constraint doc_file_parent_tenant_fk foreign key (tenant_key, parent_file_id)
    references doc.file (tenant_key, file_id),
  constraint doc_file_duplicate_tenant_fk foreign key (tenant_key, duplicate_of_file_id)
    references doc.file (tenant_key, file_id)
);

create table if not exists doc.page (
  page_id text primary key,
  tenant_key text not null,
  file_id text not null,
  page_no int not null,
  page_text text,
  char_start int,
  char_end int,
  render_blob_uri text,
  page_sha256 text,
  unique (tenant_key, page_id),
  unique (tenant_key, file_id, page_no),
  constraint doc_page_file_tenant_fk foreign key (tenant_key, file_id)
    references doc.file (tenant_key, file_id)
);

create table if not exists doc.span (
  span_id text primary key,
  tenant_key text not null,
  file_id text not null,
  span_kind text,                  -- section | clause | table | annex | signature_block | extracted_table
  heading text,
  span_text text,
  page_from int,
  page_to int,
  char_start int,
  char_end int,
  bbox_json jsonb not null default '{}'::jsonb,
  visibility_class text not null default 'internal',
  content_authenticity text not null,
  unique (tenant_key, span_id),
  constraint doc_span_file_tenant_fk foreign key (tenant_key, file_id)
    references doc.file (tenant_key, file_id)
);

create table if not exists meta.concept (
  concept_ref text primary key,    -- e.g. contract.liability_cap_amount
  domain text not null,            -- contract | commercial | rights | liability | sla | obligation | privacy | finding
  label text not null,
  datatype text not null,          -- numeric | text | date | boolean
  unit text,                       -- usd | days | pct | months | count
  definition text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists meta.concept_map (
  map_id text primary key,
  tenant_key text not null,
  source_kind text not null,       -- column | clause_pattern | span_heading | manual_rule
  source_ref text not null,        -- raw table column, heading, pattern, or rule id
  concept_ref text not null references meta.concept(concept_ref),
  transform text,
  confidence numeric,
  method text,                     -- llm_inferred | human_confirmed | learned_from_prior | deterministic_rule
  map_version int not null default 1,
  active_from timestamptz not null default now(),
  active_to timestamptz,
  supersedes_map_id text,
  reviewed_by_role text,
  reviewed_at timestamptz,
  notes text,
  unique (tenant_key, map_id),
  constraint concept_map_supersedes_tenant_fk foreign key (tenant_key, supersedes_map_id)
    references meta.concept_map (tenant_key, map_id)
);

create table if not exists doc.extraction (
  extraction_id text primary key,
  tenant_key text not null,
  load_run_id text not null,
  concept_ref text not null references meta.concept(concept_ref),
  map_id text,
  extractor_version text,
  model_id text,
  prompt_version text,
  supersedes_extraction_id text,
  active_from timestamptz not null default now(),
  active_to timestamptz,
  subject_kind text not null,      -- contract | document | vendor | sow | change_order | sla | invoice | obligation
  subject_ref text not null,
  group_id text,                   -- keeps related facts together, e.g. one rate band or change order
  group_kind text,                 -- rate_card_line | arc_rrc_band | liability_clause | sow_milestone | invoice_line
  value_text text,
  value_num numeric,
  value_date date,
  value_bool boolean,
  unit text,
  source_kind text not null,       -- span | column | manual
  source_span_id text,
  source_table text,
  source_row int,
  source_column text,
  source_file_id text,
  source_page int,
  source_section text,
  confidence numeric,
  method text,
  review_state text not null default 'unreviewed',
  reviewed_by_role text,
  reviewed_at timestamptz,
  manual_basis text,
  visibility_class text not null default 'internal',
  content_authenticity text not null,
  payload_json jsonb not null default '{}'::jsonb,
  extracted_at timestamptz default now(),
  unique (tenant_key, extraction_id),
  constraint extraction_map_tenant_fk foreign key (tenant_key, map_id)
    references meta.concept_map (tenant_key, map_id),
  constraint extraction_supersedes_tenant_fk foreign key (tenant_key, supersedes_extraction_id)
    references doc.extraction (tenant_key, extraction_id),
  constraint extraction_span_tenant_fk foreign key (tenant_key, source_span_id)
    references doc.span (tenant_key, span_id),
  constraint extraction_file_tenant_fk foreign key (tenant_key, source_file_id)
    references doc.file (tenant_key, file_id),
  constraint extraction_lineage_present check (
    (source_kind = 'span' and source_span_id is not null) or
    (source_kind = 'column' and source_table is not null and source_row is not null and source_column is not null) or
    (source_kind = 'manual' and manual_basis is not null and reviewed_by_role is not null and reviewed_at is not null)
  ),
  constraint extraction_one_value_type check (
    num_nonnulls(value_text, value_num, value_date, value_bool) = 1
  )
);

create index if not exists idx_doc_file_content_sha
  on doc.file (tenant_key, content_sha256);

create index if not exists idx_doc_file_tenant_contract
  on doc.file (tenant_key, contract_ref, document_role, load_run_id);

create index if not exists idx_doc_file_duplicate
  on doc.file (tenant_key, duplicate_state, duplicate_of_file_id);

create index if not exists idx_doc_page_file_page
  on doc.page (tenant_key, file_id, page_no);

create index if not exists idx_doc_span_tenant_file_kind
  on doc.span (tenant_key, file_id, span_kind);

create index if not exists idx_doc_span_heading
  on doc.span using gin (to_tsvector('english', coalesce(heading, '') || ' ' || coalesce(span_text, '')));

create index if not exists idx_meta_concept_domain
  on meta.concept (domain, datatype, active);

create index if not exists idx_meta_concept_map_source
  on meta.concept_map (tenant_key, source_kind, source_ref) where active_to is null;

create index if not exists idx_doc_extraction_subject
  on doc.extraction (tenant_key, subject_kind, subject_ref, concept_ref) where active_to is null;

create index if not exists idx_doc_extraction_group
  on doc.extraction (tenant_key, group_kind, group_id) where active_to is null;

create index if not exists idx_doc_extraction_numeric
  on doc.extraction (tenant_key, concept_ref, value_num) where active_to is null;

create index if not exists idx_doc_extraction_date
  on doc.extraction (tenant_key, concept_ref, value_date) where active_to is null;

create index if not exists idx_doc_extraction_map
  on doc.extraction (tenant_key, map_id, extractor_version, model_id, prompt_version);

create index if not exists idx_doc_extraction_payload
  on doc.extraction using gin (payload_json);

-- Optional pgvector add-on. Not part of the first migration unless pgvector is already approved
-- and installed in the target database.
--
-- create extension if not exists vector;
-- alter table doc.span add column embedding vector(1536);
-- create index if not exists idx_doc_span_embedding on doc.span using hnsw (embedding vector_cosine_ops);

-- Row-level security is required before production use. Policy functions below assume the
-- app already exposes tenant access through current_setting('app.tenant_key', true) or a
-- service-role bypass. Replace with the repository-standard tenant helper at migration time.

alter table doc.file enable row level security;
alter table doc.page enable row level security;
alter table doc.span enable row level security;
alter table meta.concept_map enable row level security;
alter table doc.extraction enable row level security;

drop policy if exists doc_file_tenant_isolation on doc.file;
create policy doc_file_tenant_isolation on doc.file
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists doc_page_tenant_isolation on doc.page;
create policy doc_page_tenant_isolation on doc.page
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists doc_span_tenant_isolation on doc.span;
create policy doc_span_tenant_isolation on doc.span
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists concept_map_tenant_isolation on meta.concept_map;
create policy concept_map_tenant_isolation on meta.concept_map
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

drop policy if exists extraction_tenant_isolation on doc.extraction;
create policy extraction_tenant_isolation on doc.extraction
  using (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role')
  with check (tenant_key = current_setting('app.tenant_key', true) or current_user = 'service_role');

-- meta.concept is global reference data. Do not add tenant RLS unless concept definitions become
-- tenant-specific.

-- Raw upload table convention, not a single universal physical table. The loader must create
-- the companion _column_map table beside each raw intake schema; this is not merely example DDL.
--
-- create table raw_skyharbor_air.icertis_export (
--   ... every client-supplied column as text ...,
--   _tenant_key text not null,
--   _dataset_id text not null,
--   _load_run_id text not null,
--   _source_file text not null,
--   _source_workbook text,
--   _source_sheet text,
--   _source_row_number bigint not null,
--   _source_csv_sha256 text not null,
--   _row_sha256 text not null,
--   _loaded_at timestamptz not null default now()
-- );
--
-- create table raw_skyharbor_air._column_map (
--   tenant_key text not null,
--   source_table text not null,
--   source_file text not null,
--   source_sheet text,
--   ordinal int not null,
--   original_header text not null,
--   normalized_header text not null,
--   required_flag boolean not null default false,
--   concept_ref text references meta.concept(concept_ref),
--   map_id text,
--   load_run_id text not null,
--   primary key (tenant_key, source_table, source_file, coalesce(source_sheet, ''), ordinal),
--   foreign key (tenant_key, map_id) references meta.concept_map (tenant_key, map_id)
-- );

-- Semantic extraction pipeline:
--   sem.extraction_current      active extractions only
--   sem.extraction_disagreement current competing values by subject/concept/group
--   sem.extraction_resolved     one reviewed/resolved row per subject/concept/group
--
-- Wide views must read sem.extraction_resolved. They may pivot the already-resolved facts, but
-- they must not choose truth directly from raw doc.extraction rows.

create or replace view sem.extraction_current as
select *
from doc.extraction
where active_to is null;

create or replace view sem.extraction_disagreement as
with current_values as (
  select
    tenant_key,
    subject_kind,
    subject_ref,
    coalesce(group_id, '') as group_key,
    group_kind,
    concept_ref,
    extraction_id,
    extracted_at,
    coalesce(value_text, value_num::text, value_date::text, value_bool::text) as value_key
  from sem.extraction_current
)
select
  tenant_key,
  subject_kind,
  subject_ref,
  nullif(group_key, '') as group_id,
  group_kind,
  concept_ref,
  count(*) as source_count,
  count(distinct value_key) as distinct_value_count,
  array_agg(extraction_id order by extracted_at, extraction_id) as extraction_ids
from current_values
group by tenant_key, subject_kind, subject_ref, group_key, group_kind, concept_ref
having count(distinct value_key) > 1;

create or replace view sem.extraction_resolved as
with current_values as (
  select
    e.*,
    coalesce(e.group_id, '') as group_key,
    coalesce(e.value_text, e.value_num::text, e.value_date::text, e.value_bool::text) as value_key,
    case
      when e.review_state in ('approved', 'human_confirmed', 'reviewed') then 0
      when e.method = 'deterministic_rule' then 1
      when e.method = 'learned_from_prior' then 2
      else 3
    end as resolution_rank
  from sem.extraction_current e
),
value_status as (
  select
    tenant_key,
    subject_kind,
    subject_ref,
    group_key,
    group_kind,
    concept_ref,
    count(*) as source_count,
    count(distinct value_key) as distinct_value_count,
    bool_or(review_state in ('approved', 'human_confirmed', 'reviewed')) as has_reviewed_winner
  from current_values
  group by tenant_key, subject_kind, subject_ref, group_key, group_kind, concept_ref
),
ranked as (
  select
    c.*,
    row_number() over (
      partition by c.tenant_key, c.subject_kind, c.subject_ref, c.group_key, c.group_kind, c.concept_ref
      order by c.resolution_rank, c.confidence desc nulls last, c.reviewed_at desc nulls last,
        c.extracted_at desc nulls last, c.extraction_id
    ) as rn
  from current_values c
),
winner as (
  select *
  from ranked
  where rn = 1
)
select
  s.tenant_key,
  s.subject_kind,
  s.subject_ref,
  nullif(s.group_key, '') as group_id,
  s.group_kind,
  s.concept_ref,
  case when s.distinct_value_count = 1 or s.has_reviewed_winner then w.extraction_id end as resolved_extraction_id,
  case when s.distinct_value_count = 1 or s.has_reviewed_winner then w.value_text end as value_text,
  case when s.distinct_value_count = 1 or s.has_reviewed_winner then w.value_num end as value_num,
  case when s.distinct_value_count = 1 or s.has_reviewed_winner then w.value_date end as value_date,
  case when s.distinct_value_count = 1 or s.has_reviewed_winner then w.value_bool end as value_bool,
  case when s.distinct_value_count = 1 or s.has_reviewed_winner then w.unit end as unit,
  s.source_count,
  s.distinct_value_count,
  s.distinct_value_count > 1 as conflict_flag,
  case
    when s.distinct_value_count = 1 then 'single_current_value'
    when s.has_reviewed_winner then 'reviewed_winner'
    else 'unresolved_conflict'
  end as resolution_state,
  w.map_id,
  w.extractor_version,
  w.model_id,
  w.prompt_version,
  w.review_state,
  w.reviewed_by_role,
  w.reviewed_at,
  w.source_span_id,
  w.source_file_id,
  w.source_page,
  w.source_section
from value_status s
left join winner w
  on w.tenant_key = s.tenant_key
 and w.subject_kind = s.subject_kind
 and w.subject_ref = s.subject_ref
 and w.group_key = s.group_key
 and w.group_kind is not distinct from s.group_kind
 and w.concept_ref = s.concept_ref;

create or replace view sem.contract_wide as
select
  tenant_key,
  subject_ref as contract_ref,
  max(value_num) filter (where concept_ref = 'contract.annual_value') as annual_value,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'contract.annual_value'), false) as annual_value_conflict_flag,
  max(value_num) filter (where concept_ref = 'contract.total_committed_value') as total_committed_value,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'contract.total_committed_value'), false) as total_committed_value_conflict_flag,
  max(value_date) filter (where concept_ref = 'contract.end_date') as end_date,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'contract.end_date'), false) as end_date_conflict_flag,
  max(value_num) filter (where concept_ref = 'contract.notice_period_days') as notice_period_days,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'contract.notice_period_days'), false) as notice_period_days_conflict_flag,
  bool_or(value_bool) filter (where concept_ref = 'contract.auto_renew') as auto_renew,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'contract.auto_renew'), false) as auto_renew_conflict_flag
from sem.extraction_resolved
where subject_kind = 'contract'
group by tenant_key, subject_ref;

create or replace view sem.change_order_register as
select
  tenant_key,
  subject_ref as change_order_ref,
  group_id,
  max(value_text) filter (where concept_ref = 'change_order.sow_ref') as sow_ref,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.sow_ref'), false) as sow_ref_conflict_flag,
  max(value_num) filter (where concept_ref = 'change_order.value') as value,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.value'), false) as value_conflict_flag,
  max(value_num) filter (where concept_ref = 'change_order.cumulative_value') as cumulative_value,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.cumulative_value'), false) as cumulative_value_conflict_flag,
  max(value_num) filter (where concept_ref = 'change_order.original_sow_value') as original_sow_value,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.original_sow_value'), false) as original_sow_value_conflict_flag,
  max(value_num) filter (where concept_ref = 'change_order.pct_of_original_sow') as pct_of_original_sow,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.pct_of_original_sow'), false) as pct_of_original_sow_conflict_flag,
  max(value_num) filter (where concept_ref = 'change_order.rate_impact_pct') as rate_impact_pct,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.rate_impact_pct'), false) as rate_impact_pct_conflict_flag,
  max(value_date) filter (where concept_ref = 'change_order.effective_date') as effective_date,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'change_order.effective_date'), false) as effective_date_conflict_flag
from sem.extraction_resolved
where subject_kind = 'change_order'
group by tenant_key, subject_ref, group_id;

create or replace view sem.sla_credit_history as
select
  tenant_key,
  subject_ref as sla_observation_ref,
  group_id,
  max(value_text) filter (where concept_ref = 'sla.contract_ref') as contract_ref,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'sla.contract_ref'), false) as contract_ref_conflict_flag,
  max(value_text) filter (where concept_ref = 'sla.measure') as measure,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'sla.measure'), false) as measure_conflict_flag,
  max(value_num) filter (where concept_ref = 'sla.credit_earned') as credit_earned,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'sla.credit_earned'), false) as credit_earned_conflict_flag,
  max(value_num) filter (where concept_ref = 'sla.credit_claimed') as credit_claimed,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'sla.credit_claimed'), false) as credit_claimed_conflict_flag,
  max(value_num) filter (where concept_ref = 'sla.credit_received') as credit_received,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'sla.credit_received'), false) as credit_received_conflict_flag,
  max(value_date) filter (where concept_ref = 'sla.period_start') as period_start,
  coalesce(bool_or(conflict_flag) filter (where concept_ref = 'sla.period_start'), false) as period_start_conflict_flag
from sem.extraction_resolved
where subject_kind = 'sla'
group by tenant_key, subject_ref, group_id;
