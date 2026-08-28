-- Enterprise Context Ledger physical schema v1 draft.
-- Design artifact only. Do not run against lab, preprod, or production
-- without explicit migration authorization.

create extension if not exists pgcrypto;

create schema if not exists ecl_source;
create schema if not exists ecl_context;
create schema if not exists ecl_commercial;
create schema if not exists ecl_review;
create schema if not exists ecl_projection;

create table if not exists ecl_source.source_file (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  source_type text not null,
  origin text not null default 'synthetic_generator',
  source_owner text,
  file_name text not null,
  blob_uri text not null,
  file_hash text not null,
  source_date date,
  received_at timestamptz not null default now(),
  access_class text not null,
  quality_state text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  constraint source_file_source_type_check check (
    source_type in (
      'cmdb', 'erp', 'ppm', 'clm', 'grc', 'bi', 'etl', 'ai_telemetry',
      'document', 'interview', 'manual_workbook', 'synthetic_source_room'
    )
  ),
  constraint source_file_origin_check check (
    origin in ('client_intake', 'synthetic_generator')
  ),
  constraint source_file_access_class_check check (
    access_class in ('public_demo', 'internal', 'client_confidential', 'restricted')
  ),
  constraint source_file_quality_state_check check (
    quality_state in ('accepted', 'partial', 'blocked', 'superseded')
  ),
  constraint source_file_hash_unique unique (tenant_key, assessment_id, file_hash),
  constraint source_file_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

alter table ecl_source.source_file
  add column if not exists origin text;

update ecl_source.source_file
  set origin = 'synthetic_generator'
  where origin is null;

alter table ecl_source.source_file
  alter column origin set default 'synthetic_generator',
  alter column origin set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'ecl_source.source_file'::regclass
      and conname = 'source_file_origin_check'
  ) then
    alter table ecl_source.source_file
      add constraint source_file_origin_check
      check (origin in ('client_intake', 'synthetic_generator'));
  end if;
end $$;

create table if not exists ecl_source.source_record (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  source_file_id uuid not null,
  native_id text,
  record_type text not null,
  row_number integer,
  payload_json jsonb not null,
  parse_state text not null,
  parse_notes text,
  constraint source_record_file_fk foreign key (tenant_key, assessment_id, source_file_id)
    references ecl_source.source_file (tenant_key, assessment_id, id),
  constraint source_record_parse_state_check check (
    parse_state in ('parsed', 'partial', 'failed', 'ignored')
  ),
  constraint source_record_native_unique unique nulls not distinct
    (source_file_id, record_type, native_id),
  constraint source_record_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_source.document (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  source_file_id uuid not null,
  document_key text not null,
  document_type text not null,
  title text not null,
  file_hash text not null,
  page_count integer,
  effective_date date,
  access_class text not null,
  review_state text not null,
  constraint document_file_fk foreign key (tenant_key, assessment_id, source_file_id)
    references ecl_source.source_file (tenant_key, assessment_id, id),
  constraint document_type_check check (
    document_type in (
      'contract', 'sow', 'invoice', 'sla_report', 'attestation',
      'interview_notes', 'architecture_doc'
    )
  ),
  constraint document_access_class_check check (
    access_class in ('public_demo', 'internal', 'client_confidential', 'restricted')
  ),
  constraint document_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint document_key_unique unique (tenant_key, assessment_id, document_key),
  constraint document_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_source.document_extraction (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  document_id uuid not null,
  field_key text not null,
  extracted_value text not null,
  normalized_value_json jsonb not null default '{}'::jsonb,
  page_number integer,
  span_reference text,
  basis text not null,
  confidence numeric(5,4),
  human_verification_state text not null,
  constraint document_extraction_document_fk foreign key (tenant_key, assessment_id, document_id)
    references ecl_source.document (tenant_key, assessment_id, id),
  constraint document_extraction_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint document_extraction_confidence_check check (confidence is null or confidence between 0 and 1),
  constraint document_extraction_human_state_check check (
    human_verification_state in ('unverified', 'verified', 'corrected', 'rejected')
  ),
  constraint document_extraction_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_context.object_type_catalog (
  object_type text primary key,
  display_label text not null,
  grain text not null,
  counting_class text not null,
  description text not null,
  constraint object_type_catalog_grain_check check (
    grain in (
      'enterprise', 'business_segment', 'business_function', 'organization',
      'process', 'application', 'application_deployment', 'data_platform', 'data_product',
      'infrastructure', 'vendor', 'contract', 'program', 'metric',
      'risk', 'control', 'ai_program', 'ai_use_case', 'ai_tool', 'persona'
    )
  ),
  constraint object_type_catalog_counting_class_check check (
    counting_class in (
      'enterprise_scope',
      'business_entity',
      'deployment_instance',
      'technical_component',
      'commercial_entity',
      'initiative',
      'risk_control',
      'metric_definition',
      'persona'
    )
  )
);

insert into ecl_context.object_type_catalog (
  object_type,
  display_label,
  grain,
  counting_class,
  description
) values
('enterprise', 'Enterprise', 'enterprise', 'enterprise_scope', 'Whole-enterprise assessment subject.'),
('business_segment', 'Business Segment', 'business_segment', 'business_entity', 'Business segment or operating model slice.'),
('business_function', 'Business Function', 'business_function', 'business_entity', 'Business function used for ownership and portfolio slicing.'),
('organization', 'Organization', 'organization', 'business_entity', 'Organization, team, or accountable owner group.'),
('process', 'Process', 'process', 'business_entity', 'Business or operating process.'),
('application', 'Application', 'application', 'business_entity', 'Logical business application counted in estate totals.'),
('application_deployment', 'Application Deployment', 'application_deployment', 'deployment_instance', 'Environment-specific deployment instance; never counted as an application.'),
('data_platform', 'Data Platform', 'data_platform', 'technical_component', 'Data, analytics, reporting, or integration platform.'),
('data_product', 'Data Product', 'data_product', 'business_entity', 'Business-facing governed data product.'),
('infrastructure', 'Infrastructure', 'infrastructure', 'technical_component', 'Infrastructure, hosting, cloud, network, or datacenter component.'),
('vendor', 'Vendor', 'vendor', 'commercial_entity', 'Supplier or contracting entity.'),
('contract', 'Contract', 'contract', 'commercial_entity', 'Contract or agreement object.'),
('program', 'Program', 'program', 'initiative', 'Funded program or initiative container.'),
('metric', 'Metric', 'metric', 'metric_definition', 'Metric object when represented as context.'),
('risk', 'Risk', 'risk', 'risk_control', 'Risk object.'),
('control', 'Control', 'control', 'risk_control', 'Control object.'),
('ai_program', 'AI Program', 'ai_program', 'initiative', 'AI program or portfolio container.'),
('ai_use_case', 'AI Use Case', 'ai_use_case', 'business_entity', 'AI use case or workflow target.'),
('ai_tool', 'AI Tool', 'ai_tool', 'technical_component', 'AI tool, model, or platform capability.'),
('persona', 'Persona', 'persona', 'persona', 'Role or user persona.')
on conflict (object_type) do update set
  display_label = excluded.display_label,
  grain = excluded.grain,
  counting_class = excluded.counting_class,
  description = excluded.description;

create table if not exists ecl_context.object (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  object_key text not null,
  object_type text not null,
  display_name text not null,
  business_domain text,
  lifecycle_state text not null,
  source_record_id uuid,
  basis text not null,
  value_state text not null,
  review_state text not null,
  confidence numeric(5,4),
  attributes_json jsonb not null default '{}'::jsonb,
  canonical_semantic_type text generated always as (
    coalesce(nullif(attributes_json ->> 'canonical_semantic_type', ''), object_type)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint object_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint object_type_catalog_fk foreign key (object_type)
    references ecl_context.object_type_catalog (object_type),
  constraint object_lifecycle_state_check check (
    lifecycle_state in ('current', 'target', 'planned', 'actual', 'baseline', 'forecast', 'benchmark', 'retired', 'candidate')
  ),
  constraint object_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint object_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint object_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint object_confidence_check check (confidence is null or confidence between 0 and 1),
  constraint object_canonical_semantic_type_check check (canonical_semantic_type <> ''),
  constraint object_semantic_key_unique unique (
    tenant_key,
    assessment_id,
    object_type,
    canonical_semantic_type,
    object_key
  ),
  constraint object_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_context.relationship (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  from_object_id uuid not null,
  relationship_type text not null,
  to_object_id uuid not null,
  direction_label text,
  source_record_id uuid,
  basis text not null,
  value_state text not null,
  review_state text not null,
  confidence numeric(5,4),
  attributes_json jsonb not null default '{}'::jsonb,
  constraint relationship_from_object_fk foreign key (tenant_key, assessment_id, from_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint relationship_to_object_fk foreign key (tenant_key, assessment_id, to_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint relationship_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint relationship_no_self_loop_check check (from_object_id <> to_object_id),
  constraint relationship_type_check check (
    relationship_type in (
      'HAS_FUNCTION', 'OWNED_BY', 'SUPPORTED_BY', 'SUPPLIED_BY', 'COVERED_BY',
      'HOSTED_ON', 'DEPLOYMENT_OF', 'INTEGRATES_WITH', 'PRODUCES', 'CONSUMES', 'DEPENDS_ON',
      'CHANGES', 'MITIGATES', 'CONTROLS', 'MEASURED_BY', 'USED_BY', 'FUNDED_BY'
    )
  ),
  constraint relationship_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint relationship_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint relationship_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint relationship_confidence_check check (confidence is null or confidence between 0 and 1),
  constraint relationship_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_context.metric_definition (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  metric_key text not null,
  metric_name text not null,
  definition text not null,
  unit text not null,
  directionality text not null,
  cadence text not null,
  aggregation_rule text not null,
  constraint metric_definition_directionality_check check (
    directionality in ('higher_is_better', 'lower_is_better', 'neutral')
  ),
  constraint metric_definition_cadence_check check (
    cadence in ('monthly', 'quarterly', 'annual', 'point_in_time')
  ),
  constraint metric_definition_aggregation_rule_check check (
    aggregation_rule in ('sum', 'avg', 'max', 'min', 'latest', 'none')
  ),
  constraint metric_definition_key_unique unique (tenant_key, metric_key)
);

create table if not exists ecl_context.measure (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  subject_object_id uuid not null,
  metric_key text not null,
  value_number numeric,
  value_text text,
  unit text not null,
  period_start date,
  period_end date,
  scenario text not null,
  source_record_id uuid,
  document_extraction_id uuid,
  basis text not null,
  value_state text not null,
  quality_state text not null,
  review_state text not null,
  attributes_json jsonb not null default '{}'::jsonb,
  constraint measure_subject_object_fk foreign key (tenant_key, assessment_id, subject_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint measure_metric_definition_fk foreign key (tenant_key, metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint measure_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint measure_document_extraction_fk foreign key (tenant_key, assessment_id, document_extraction_id)
    references ecl_source.document_extraction (tenant_key, assessment_id, id),
  constraint measure_scenario_check check (
    scenario in ('current', 'target', 'planned', 'actual', 'baseline', 'forecast', 'benchmark', 'retired', 'candidate')
  ),
  constraint measure_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint measure_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint measure_quality_state_check check (
    quality_state in ('usable', 'estimated', 'conflicting', 'blocked', 'insufficient')
  ),
  constraint measure_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint measure_known_value_check check (
    (value_state = 'known' and num_nonnulls(value_number, value_text) = 1)
    or (value_state <> 'known')
  ),
  constraint measure_unknown_not_zero_check check (
    (value_state in ('unknown', 'not_applicable') and value_number is null and value_text is null)
    or value_state not in ('unknown', 'not_applicable')
  ),
  constraint measure_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_context.snapshot (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_key text not null,
  snapshot_type text not null,
  source_hash text not null,
  context_hash text not null,
  created_by_job text not null,
  quality_state text not null,
  proof_uri text not null,
  created_at timestamptz not null default now(),
  constraint snapshot_type_check check (
    snapshot_type in ('baseline', 'review_pack', 'approved_context', 'projection_source')
  ),
  constraint snapshot_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint snapshot_key_unique unique (tenant_key, assessment_id, snapshot_key),
  constraint snapshot_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_context.context_pack (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  pack_key text not null,
  pack_version integer not null,
  payload_json jsonb not null,
  payload_hash text not null,
  retrieval_state text not null,
  quality_state text not null,
  proof_uri text not null,
  created_at timestamptz not null default now(),
  constraint context_pack_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint context_pack_retrieval_state_check check (
    retrieval_state in ('not_indexed', 'indexed', 'retrieved', 'cited', 'blocked')
  ),
  constraint context_pack_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint context_pack_version_check check (pack_version > 0),
  constraint context_pack_key_version_unique unique (tenant_key, assessment_id, pack_key, pack_version),
  constraint context_pack_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_commercial.contract (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  contract_object_id uuid not null,
  vendor_object_id uuid not null,
  contract_number text,
  contract_name text not null,
  contract_type text,
  start_date date,
  end_date date,
  renewal_notice_date date,
  annualized_value_usd numeric,
  total_contract_value_usd numeric,
  currency text not null default 'USD',
  source_document_id uuid,
  source_record_id uuid,
  basis text not null,
  value_state text not null,
  review_state text not null,
  attributes_json jsonb not null default '{}'::jsonb,
  constraint contract_object_fk foreign key (tenant_key, assessment_id, contract_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint contract_vendor_object_fk foreign key (tenant_key, assessment_id, vendor_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint contract_source_document_fk foreign key (tenant_key, assessment_id, source_document_id)
    references ecl_source.document (tenant_key, assessment_id, id),
  constraint contract_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint contract_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint contract_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint contract_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint contract_unknown_money_null_check check (
    value_state not in ('unknown', 'not_applicable')
    or (annualized_value_usd is null and total_contract_value_usd is null)
  ),
  constraint contract_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_commercial.contract_service_line (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  contract_id uuid not null,
  service_line_key text not null,
  service_category text not null,
  description text not null,
  annualized_value_usd numeric,
  value_state text not null,
  source_record_id uuid,
  document_extraction_id uuid,
  review_state text not null,
  constraint contract_service_line_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint contract_service_line_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint contract_service_line_document_extraction_fk foreign key (tenant_key, assessment_id, document_extraction_id)
    references ecl_source.document_extraction (tenant_key, assessment_id, id),
  constraint contract_service_line_category_check check (
    service_category in ('software', 'cloud', 'managed_service', 'support', 'data', 'ai', 'labor', 'professional_service')
  ),
  constraint contract_service_line_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint contract_service_line_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint contract_service_line_unknown_money_null_check check (
    value_state not in ('unknown', 'not_applicable') or annualized_value_usd is null
  ),
  constraint contract_service_line_key_unique unique (tenant_key, assessment_id, contract_id, service_line_key),
  constraint contract_service_line_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_commercial.contract_scope (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  contract_id uuid not null,
  scoped_object_id uuid not null,
  scope_type text not null,
  allocation_percent numeric(8,4),
  allocation_amount_usd numeric,
  basis text not null,
  value_state text not null,
  source_record_id uuid,
  review_state text not null,
  constraint contract_scope_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint contract_scope_object_fk foreign key (tenant_key, assessment_id, scoped_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint contract_scope_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint contract_scope_type_check check (
    scope_type in ('application', 'function', 'platform', 'region', 'service', 'data_product', 'ai_use_case')
  ),
  constraint contract_scope_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint contract_scope_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint contract_scope_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint contract_scope_allocation_percent_check check (
    allocation_percent is null or allocation_percent between 0 and 100
  ),
  constraint contract_scope_unique unique (tenant_key, assessment_id, contract_id, scoped_object_id, scope_type),
  constraint contract_scope_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_commercial.invoice_line (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  invoice_line_key text not null,
  vendor_object_id uuid not null,
  contract_id uuid,
  cost_center_object_id uuid,
  period_start date not null,
  period_end date not null,
  amount_usd numeric not null,
  gl_account text,
  spend_category text,
  source_record_id uuid not null,
  basis text not null,
  value_state text not null,
  review_state text not null,
  zero_amount_reason text,
  constraint invoice_line_vendor_object_fk foreign key (tenant_key, assessment_id, vendor_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint invoice_line_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint invoice_line_cost_center_object_fk foreign key (tenant_key, assessment_id, cost_center_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint invoice_line_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint invoice_line_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint invoice_line_value_state_check check (value_state in ('known', 'conflicting')),
  constraint invoice_line_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint invoice_line_period_check check (period_end >= period_start),
  constraint invoice_line_zero_reason_check check (amount_usd <> 0 or zero_amount_reason is not null),
  constraint invoice_line_key_unique unique (tenant_key, assessment_id, invoice_line_key),
  constraint invoice_line_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_commercial.sla_observation (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  contract_id uuid,
  service_line_id uuid,
  scoped_object_id uuid,
  metric_key text not null,
  target_value_number numeric,
  actual_value_number numeric,
  unit text not null,
  period_start date not null,
  period_end date not null,
  source_record_id uuid,
  document_extraction_id uuid,
  basis text not null,
  value_state text not null,
  quality_state text not null,
  review_state text not null,
  constraint sla_observation_contract_fk foreign key (tenant_key, assessment_id, contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint sla_observation_service_line_fk foreign key (tenant_key, assessment_id, service_line_id)
    references ecl_commercial.contract_service_line (tenant_key, assessment_id, id),
  constraint sla_observation_scoped_object_fk foreign key (tenant_key, assessment_id, scoped_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint sla_observation_metric_definition_fk foreign key (tenant_key, metric_key)
    references ecl_context.metric_definition (tenant_key, metric_key),
  constraint sla_observation_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint sla_observation_document_extraction_fk foreign key (tenant_key, assessment_id, document_extraction_id)
    references ecl_source.document_extraction (tenant_key, assessment_id, id),
  constraint sla_observation_subject_check check (
    num_nonnulls(contract_id, service_line_id, scoped_object_id) >= 1
  ),
  constraint sla_observation_period_check check (period_end >= period_start),
  constraint sla_observation_basis_check check (
    basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint sla_observation_value_state_check check (
    value_state in ('known', 'estimated', 'unknown', 'not_applicable', 'conflicting')
  ),
  constraint sla_observation_quality_state_check check (
    quality_state in ('usable', 'estimated', 'conflicting', 'blocked', 'insufficient')
  ),
  constraint sla_observation_review_state_check check (
    review_state in ('not_reviewed', 'in_review', 'confirmed', 'corrected', 'rejected', 'blocked', 'superseded')
  ),
  constraint sla_observation_unknown_value_check check (
    value_state not in ('unknown', 'not_applicable')
    or (target_value_number is null and actual_value_number is null)
  ),
  constraint sla_observation_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_review.review_event (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  subject_kind text not null,
  subject_object_id uuid,
  subject_relationship_id uuid,
  subject_measure_id uuid,
  subject_contract_id uuid,
  subject_service_line_id uuid,
  subject_scope_id uuid,
  subject_invoice_line_id uuid,
  subject_sla_observation_id uuid,
  subject_document_extraction_id uuid,
  subject_context_pack_id uuid,
  review_event_type text not null,
  previous_value_json jsonb,
  new_value_json jsonb,
  decision_basis text not null,
  reviewer_role text,
  source_document_id uuid,
  source_record_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  constraint review_event_object_fk foreign key (tenant_key, assessment_id, subject_object_id)
    references ecl_context.object (tenant_key, assessment_id, id),
  constraint review_event_relationship_fk foreign key (tenant_key, assessment_id, subject_relationship_id)
    references ecl_context.relationship (tenant_key, assessment_id, id),
  constraint review_event_measure_fk foreign key (tenant_key, assessment_id, subject_measure_id)
    references ecl_context.measure (tenant_key, assessment_id, id),
  constraint review_event_contract_fk foreign key (tenant_key, assessment_id, subject_contract_id)
    references ecl_commercial.contract (tenant_key, assessment_id, id),
  constraint review_event_service_line_fk foreign key (tenant_key, assessment_id, subject_service_line_id)
    references ecl_commercial.contract_service_line (tenant_key, assessment_id, id),
  constraint review_event_scope_fk foreign key (tenant_key, assessment_id, subject_scope_id)
    references ecl_commercial.contract_scope (tenant_key, assessment_id, id),
  constraint review_event_invoice_line_fk foreign key (tenant_key, assessment_id, subject_invoice_line_id)
    references ecl_commercial.invoice_line (tenant_key, assessment_id, id),
  constraint review_event_sla_observation_fk foreign key (tenant_key, assessment_id, subject_sla_observation_id)
    references ecl_commercial.sla_observation (tenant_key, assessment_id, id),
  constraint review_event_document_extraction_fk foreign key (tenant_key, assessment_id, subject_document_extraction_id)
    references ecl_source.document_extraction (tenant_key, assessment_id, id),
  constraint review_event_context_pack_fk foreign key (tenant_key, assessment_id, subject_context_pack_id)
    references ecl_context.context_pack (tenant_key, assessment_id, id),
  constraint review_event_source_document_fk foreign key (tenant_key, assessment_id, source_document_id)
    references ecl_source.document (tenant_key, assessment_id, id),
  constraint review_event_source_record_fk foreign key (tenant_key, assessment_id, source_record_id)
    references ecl_source.source_record (tenant_key, assessment_id, id),
  constraint review_event_one_subject_check check (
    num_nonnulls(
      subject_object_id,
      subject_relationship_id,
      subject_measure_id,
      subject_contract_id,
      subject_service_line_id,
      subject_scope_id,
      subject_invoice_line_id,
      subject_sla_observation_id,
      subject_document_extraction_id,
      subject_context_pack_id
    ) = 1
  ),
  constraint review_event_subject_kind_matches_check check (
    (subject_kind = 'object' and subject_object_id is not null)
    or (subject_kind = 'relationship' and subject_relationship_id is not null)
    or (subject_kind = 'measure' and subject_measure_id is not null)
    or (subject_kind = 'contract' and subject_contract_id is not null)
    or (subject_kind = 'service_line' and subject_service_line_id is not null)
    or (subject_kind = 'scope' and subject_scope_id is not null)
    or (subject_kind = 'invoice_line' and subject_invoice_line_id is not null)
    or (subject_kind = 'sla_observation' and subject_sla_observation_id is not null)
    or (subject_kind = 'document_extraction' and subject_document_extraction_id is not null)
    or (subject_kind = 'context_pack' and subject_context_pack_id is not null)
  ),
  constraint review_event_type_check check (
    review_event_type in ('confirm', 'correct', 'reject', 'block', 'resolve_conflict', 'mark_unknown', 'supersede')
  ),
  constraint review_event_decision_basis_check check (
    decision_basis in ('source_recorded', 'document_extracted', 'interview_derived', 'calculated', 'model_inferred', 'owner_confirmed', 'unknown')
  ),
  constraint review_event_tenant_assessment_id_unique unique (tenant_key, assessment_id, id)
);

create table if not exists ecl_projection.projection_manifest (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null,
  assessment_id text not null,
  snapshot_id uuid not null,
  projection_key text not null,
  projection_version integer not null,
  rebuild_command text not null,
  source_hash text not null,
  projection_hash text not null,
  row_count integer not null,
  quality_state text not null,
  admission_status text not null default 'not_applicable',
  admission_gate_results_json jsonb not null default '[]'::jsonb,
  gated_claim_count integer not null default 0,
  proof_uri text not null,
  created_at timestamptz not null default now(),
  constraint projection_manifest_snapshot_fk foreign key (tenant_key, assessment_id, snapshot_id)
    references ecl_context.snapshot (tenant_key, assessment_id, id),
  constraint projection_manifest_version_check check (projection_version > 0),
  constraint projection_manifest_row_count_check check (row_count >= 0),
  constraint projection_manifest_quality_state_check check (
    quality_state in ('passed', 'warning', 'blocked')
  ),
  constraint projection_manifest_admission_status_check check (
    admission_status in ('admitted', 'refused', 'not_applicable')
  ),
  constraint projection_manifest_admission_payload_check check (
    (
      admission_status = 'refused'
      and admission_gate_results_json <> '[]'::jsonb
    )
    or (
      admission_status in ('admitted', 'not_applicable')
      and admission_gate_results_json = '[]'::jsonb
    )
  ),
  constraint projection_manifest_gated_claim_count_check check (gated_claim_count >= 0),
  constraint projection_manifest_unique unique (tenant_key, assessment_id, projection_key, projection_version)
);

create index if not exists idx_source_file_tenant_type
  on ecl_source.source_file (tenant_key, assessment_id, source_type);
create index if not exists idx_source_file_tenant_origin
  on ecl_source.source_file (tenant_key, assessment_id, origin);
create index if not exists idx_source_record_tenant_type
  on ecl_source.source_record (tenant_key, assessment_id, record_type);
create index if not exists idx_source_record_payload_gin
  on ecl_source.source_record using gin (payload_json);
create index if not exists idx_document_tenant_type_review
  on ecl_source.document (tenant_key, assessment_id, document_type, review_state);
create index if not exists idx_document_extraction_field
  on ecl_source.document_extraction (tenant_key, assessment_id, document_id, field_key);

create index if not exists idx_object_type_catalog_counting
  on ecl_context.object_type_catalog (counting_class, grain);
create index if not exists idx_object_type_domain
  on ecl_context.object (tenant_key, assessment_id, object_type, business_domain);
create index if not exists idx_object_display_name
  on ecl_context.object (tenant_key, assessment_id, display_name);
create index if not exists idx_object_attributes_gin
  on ecl_context.object using gin (attributes_json);
create index if not exists idx_relationship_from
  on ecl_context.relationship (tenant_key, assessment_id, from_object_id);
create index if not exists idx_relationship_to
  on ecl_context.relationship (tenant_key, assessment_id, to_object_id);
create index if not exists idx_relationship_type
  on ecl_context.relationship (tenant_key, assessment_id, relationship_type);
create index if not exists idx_measure_subject_metric
  on ecl_context.measure (tenant_key, assessment_id, subject_object_id, metric_key);
create index if not exists idx_measure_metric_period
  on ecl_context.measure (tenant_key, assessment_id, metric_key, scenario, period_end);
create index if not exists idx_context_pack_key_version
  on ecl_context.context_pack (tenant_key, assessment_id, pack_key, pack_version desc);

create index if not exists idx_contract_vendor
  on ecl_commercial.contract (tenant_key, assessment_id, vendor_object_id);
create index if not exists idx_contract_renewal
  on ecl_commercial.contract (tenant_key, assessment_id, renewal_notice_date);
create index if not exists idx_contract_scope_object
  on ecl_commercial.contract_scope (tenant_key, assessment_id, scoped_object_id);
create index if not exists idx_invoice_line_vendor_period
  on ecl_commercial.invoice_line (tenant_key, assessment_id, vendor_object_id, period_end);
create index if not exists idx_invoice_line_contract
  on ecl_commercial.invoice_line (tenant_key, assessment_id, contract_id);
create index if not exists idx_sla_observation_metric_period
  on ecl_commercial.sla_observation (tenant_key, assessment_id, metric_key, period_end);

create index if not exists idx_review_event_subject
  on ecl_review.review_event (tenant_key, assessment_id, subject_kind, created_at desc);
create index if not exists idx_projection_manifest_key_version
  on ecl_projection.projection_manifest (tenant_key, assessment_id, projection_key, projection_version desc);

create or replace view ecl_context.application_v as
select
  o.*,
  otc.grain,
  otc.counting_class
from ecl_context.object o
join ecl_context.object_type_catalog otc on otc.object_type = o.object_type
where otc.grain = 'application'
  and otc.counting_class = 'business_entity';

create or replace view ecl_context.application_deployment_v as
select
  o.*,
  otc.grain,
  otc.counting_class
from ecl_context.object o
join ecl_context.object_type_catalog otc on otc.object_type = o.object_type
where otc.grain = 'application_deployment'
  and otc.counting_class = 'deployment_instance';

create or replace view ecl_context.business_object_v as
select
  o.*,
  otc.grain,
  otc.counting_class
from ecl_context.object o
join ecl_context.object_type_catalog otc on otc.object_type = o.object_type
where otc.counting_class in (
  'enterprise_scope',
  'business_entity',
  'commercial_entity',
  'initiative',
  'risk_control',
  'metric_definition',
  'persona'
);

create or replace view ecl_context.technical_component_v as
select
  o.*,
  otc.grain,
  otc.counting_class
from ecl_context.object o
join ecl_context.object_type_catalog otc on otc.object_type = o.object_type
where otc.counting_class in ('technical_component', 'deployment_instance');

alter table ecl_source.source_file enable row level security;
alter table ecl_source.source_record enable row level security;
alter table ecl_source.document enable row level security;
alter table ecl_source.document_extraction enable row level security;
alter table ecl_context.object enable row level security;
alter table ecl_context.relationship enable row level security;
alter table ecl_context.metric_definition enable row level security;
alter table ecl_context.measure enable row level security;
alter table ecl_context.snapshot enable row level security;
alter table ecl_context.context_pack enable row level security;
alter table ecl_commercial.contract enable row level security;
alter table ecl_commercial.contract_service_line enable row level security;
alter table ecl_commercial.contract_scope enable row level security;
alter table ecl_commercial.invoice_line enable row level security;
alter table ecl_commercial.sla_observation enable row level security;
alter table ecl_review.review_event enable row level security;
alter table ecl_projection.projection_manifest enable row level security;
