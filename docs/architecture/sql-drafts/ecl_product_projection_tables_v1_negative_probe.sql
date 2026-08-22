-- ECL product projection table negative probe.
-- Run only in a disposable database after:
--   1. ecl_physical_schema_v1_draft.sql
--   2. ecl_product_projection_tables_v1_draft.sql
-- Expected result: this script completes because each bad insert is rejected.

begin;

insert into ecl_source.source_file (
  id,
  tenant_key,
  assessment_id,
  source_type,
  file_name,
  blob_uri,
  file_hash,
  access_class,
  quality_state
) values (
  '20000000-0000-0000-0000-000000000001',
  'meridian-health',
  'assessment-projection-smoke',
  'synthetic_source_room',
  'projection-smoke.csv',
  'azure://example/proof/projection-smoke.csv',
  'hash-projection-smoke-source-file',
  'public_demo',
  'accepted'
);

insert into ecl_source.source_record (
  id,
  tenant_key,
  assessment_id,
  source_file_id,
  native_id,
  record_type,
  payload_json,
  parse_state
) values (
  '20000000-0000-0000-0000-000000000002',
  'meridian-health',
  'assessment-projection-smoke',
  '20000000-0000-0000-0000-000000000001',
  'APP-EPIC-TAPESTRY',
  'business_application',
  '{"application_name":"Epic Tapestry","vendor":"Epic Systems Corporation"}'::jsonb,
  'parsed'
);

insert into ecl_context.object (
  id,
  tenant_key,
  assessment_id,
  object_key,
  object_type,
  display_name,
  business_domain,
  lifecycle_state,
  source_record_id,
  basis,
  value_state,
  review_state
) values
(
  '20000000-0000-0000-0000-000000000003',
  'meridian-health',
  'assessment-projection-smoke',
  'APP-0001',
  'application',
  'Epic Tapestry',
  'Health Plan Operations',
  'current',
  '20000000-0000-0000-0000-000000000002',
  'source_recorded',
  'known',
  'not_reviewed'
),
(
  '20000000-0000-0000-0000-000000000004',
  'meridian-health',
  'assessment-projection-smoke',
  'VEN-0001',
  'vendor',
  'Epic Systems Corporation',
  'Clinical and Payer Platforms',
  'current',
  '20000000-0000-0000-0000-000000000002',
  'source_recorded',
  'known',
  'not_reviewed'
),
(
  '20000000-0000-0000-0000-000000000005',
  'meridian-health',
  'assessment-projection-smoke',
  'CON-0001',
  'contract',
  'Epic payer platform agreement',
  'Health Plan Operations',
  'current',
  '20000000-0000-0000-0000-000000000002',
  'source_recorded',
  'known',
  'not_reviewed'
);

insert into ecl_context.metric_definition (
  id,
  tenant_key,
  metric_key,
  metric_name,
  definition,
  unit,
  directionality,
  cadence,
  aggregation_rule
) values (
  '20000000-0000-0000-0000-000000000006',
  'meridian-health',
  'annual_spend_usd',
  'Annual spend',
  'Annualized spend in USD.',
  'USD',
  'neutral',
  'annual',
  'sum'
)
on conflict (tenant_key, metric_key) do nothing;

insert into ecl_context.snapshot (
  id,
  tenant_key,
  assessment_id,
  snapshot_key,
  snapshot_type,
  source_hash,
  context_hash,
  created_by_job,
  quality_state,
  proof_uri
) values (
  '20000000-0000-0000-0000-000000000007',
  'meridian-health',
  'assessment-projection-smoke',
  'snapshot-smoke',
  'projection_source',
  'source-hash-smoke',
  'context-hash-smoke',
  'job-ecl-smoke',
  'passed',
  'azure://example/proof/snapshot-smoke'
);

insert into ecl_context.context_pack (
  id,
  tenant_key,
  assessment_id,
  snapshot_id,
  pack_key,
  pack_version,
  payload_json,
  payload_hash,
  retrieval_state,
  quality_state,
  proof_uri
) values (
  '20000000-0000-0000-0000-000000000008',
  'meridian-health',
  'assessment-projection-smoke',
  '20000000-0000-0000-0000-000000000007',
  'enterprise_orientation',
  1,
  '{"summary":"projection smoke"}'::jsonb,
  'pack-hash-smoke',
  'indexed',
  'passed',
  'azure://example/proof/context-pack-smoke'
);

insert into ecl_projection.projection_manifest (
  id,
  tenant_key,
  assessment_id,
  snapshot_id,
  projection_key,
  projection_version,
  rebuild_command,
  source_hash,
  projection_hash,
  row_count,
  quality_state,
  proof_uri
) values (
  '20000000-0000-0000-0000-000000000009',
  'meridian-health',
  'assessment-projection-smoke',
  '20000000-0000-0000-0000-000000000007',
  'home_enterprise_landscape',
  1,
  'job-ecl-projection-build-smoke',
  'source-hash-smoke',
  'projection-hash-smoke',
  0,
  'passed',
  'azure://example/proof/projection-smoke'
);

do $$
begin
  insert into ecl_projection.projection_manifest (
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_key,
    projection_version,
    rebuild_command,
    source_hash,
    projection_hash,
    row_count,
    quality_state,
    admission_status,
    admission_gate_results_json,
    proof_uri
  ) values (
    'meridian-health',
    'assessment-projection-smoke',
    '20000000-0000-0000-0000-000000000007',
    'home_enterprise_landscape',
    2,
    'job-ecl-projection-build-smoke',
    'source-hash-smoke',
    'projection-hash-bad-admission-smoke',
    1,
    'passed',
    'admitted',
    '[{"gate":"end_to_end_data_flow","status":"refused"}]'::jsonb,
    'azure://example/proof/projection-bad-admission-smoke'
  );

  raise exception 'Check probe failed: admitted projection manifest with refusal payload was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: admitted projection manifest cannot carry refusal payload';
end $$;

insert into ecl_commercial.contract (
  id,
  tenant_key,
  assessment_id,
  contract_object_id,
  vendor_object_id,
  contract_name,
  annualized_value_usd,
  basis,
  value_state,
  review_state
) values (
  '20000000-0000-0000-0000-000000000010',
  'meridian-health',
  'assessment-projection-smoke',
  '20000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000004',
  'Epic payer platform agreement',
  1000000,
  'source_recorded',
  'known',
  'not_reviewed'
);

do $$
begin
  insert into ecl_projection.home_enterprise_landscape (
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_version,
    page_key,
    row_key,
    section_key,
    row_type,
    title,
    basis_summary,
    value_state,
    quality_state,
    admission_status,
    admission_gate_key,
    source_hash
  ) values (
    'meridian-health',
    'assessment-projection-smoke',
    '20000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000009',
    1,
    'current_state_data_flow',
    'bad-refusal',
    'architecture',
    'refusal',
    'Bad empty refusal',
    'source_recorded',
    'unknown',
    'blocked',
    'refused',
    'end_to_end_data_flow',
    'source-hash-smoke'
  );

  raise exception 'Check probe failed: refused Home projection without refusal payload was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: refused Home projection requires refusal payload';
end $$;

do $$
begin
  insert into ecl_projection.home_enterprise_landscape (
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_version,
    page_key,
    row_key,
    section_key,
    row_type,
    title,
    basis_summary,
    value_state,
    quality_state,
    admission_status,
    admission_gate_key,
    admission_result_json,
    source_hash
  ) values (
    'meridian-health',
    'assessment-projection-smoke',
    '20000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000009',
    1,
    'current_state_data_flow',
    'bad-admitted-refusal-payload',
    'architecture',
    'answer',
    'Bad admitted refusal payload',
    'source_recorded',
    'known',
    'passed',
    'admitted',
    'end_to_end_data_flow',
    '{"gate":"end_to_end_data_flow","status":"refused"}'::jsonb,
    'source-hash-smoke'
  );

  raise exception 'Check probe failed: admitted Home projection with refusal payload was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: admitted Home projection cannot carry refusal payload';
end $$;

do $$
begin
  insert into ecl_projection.tower_command_center (
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_version,
    page_key,
    row_key,
    row_type,
    claim_id,
    claim_gate_status,
    promised_value_usd,
    value_state,
    quality_state,
    source_hash
  ) values (
    'meridian-health',
    'assessment-projection-smoke',
    '20000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000009',
    1,
    'value_proof',
    'bad-gated-claim',
    'claim',
    'CLAIM-001',
    'gated',
    500000,
    'known',
    'warning',
    'source-hash-smoke'
  );

  raise exception 'Check probe failed: gated Tower claim without reason was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: gated Tower claim requires reason';
end $$;

do $$
begin
  insert into ecl_projection.source_contract_360 (
    tenant_key,
    assessment_id,
    snapshot_id,
    projection_manifest_id,
    projection_version,
    row_key,
    contract_id,
    contract_object_id,
    vendor_object_id,
    contract_name,
    vendor_name,
    value_state,
    quality_state,
    source_hash
  ) values (
    'meridian-health',
    'assessment-projection-smoke',
    '20000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000009',
    1,
    'bad-contract',
    '99999999-9999-9999-9999-999999999999',
    '20000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000004',
    'Missing contract',
    'Epic Systems Corporation',
    'known',
    'passed',
    'source-hash-smoke'
  );

  raise exception 'FK probe failed: Source contract projection without contract FK was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: Source contract projection requires contract FK';
end $$;

do $$
begin
  insert into ecl_projection.intelligence_context_pack (
    tenant_key,
    assessment_id,
    snapshot_id,
    context_pack_id,
    projection_manifest_id,
    projection_version,
    row_key,
    surface_key,
    retrieval_state,
    value_state,
    quality_state,
    access_class,
    source_hash
  ) values (
    'meridian-health',
    'assessment-projection-smoke',
    '20000000-0000-0000-0000-000000000007',
    '99999999-9999-9999-9999-999999999998',
    '20000000-0000-0000-0000-000000000009',
    1,
    'bad-context-pack',
    'ask_api',
    'indexed',
    'known',
    'passed',
    'public_demo',
    'source-hash-smoke'
  );

  raise exception 'FK probe failed: Intelligence projection without context pack FK was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: Intelligence projection requires context pack FK';
end $$;

rollback;
