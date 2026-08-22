-- Enterprise Context Ledger FK/check negative probe.
-- Run only in a disposable database after ecl_physical_schema_v1_draft.sql.
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
  '10000000-0000-0000-0000-000000000001',
  'meridian-health',
  'assessment-smoke',
  'synthetic_source_room',
  'cmdb-smoke.csv',
  'azure://example/proof/cmdb-smoke.csv',
  'hash-smoke-source-file',
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
  '10000000-0000-0000-0000-000000000002',
  'meridian-health',
  'assessment-smoke',
  '10000000-0000-0000-0000-000000000001',
  'APP-EPIC-TAPESTRY',
  'business_application',
  '{"application_name":"Epic Tapestry","vendor":"Epic Systems Corporation"}'::jsonb,
  'parsed'
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
  '10000000-0000-0000-0000-000000000003',
  'meridian-health',
  'annual_spend_usd',
  'Annual spend',
  'Annualized spend in USD.',
  'USD',
  'neutral',
  'annual',
  'sum'
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
  '10000000-0000-0000-0000-000000000004',
  'meridian-health',
  'assessment-smoke',
  'APP-0001',
  'application',
  'Epic Tapestry',
  'Health Plan Operations',
  'current',
  '10000000-0000-0000-0000-000000000002',
  'source_recorded',
  'known',
  'not_reviewed'
),
(
  '10000000-0000-0000-0000-000000000005',
  'meridian-health',
  'assessment-smoke',
  'VEN-0001',
  'vendor',
  'Epic Systems Corporation',
  'Clinical and Payer Platforms',
  'current',
  '10000000-0000-0000-0000-000000000002',
  'source_recorded',
  'known',
  'not_reviewed'
);

do $$
begin
  insert into ecl_context.relationship (
    tenant_key,
    assessment_id,
    from_object_id,
    relationship_type,
    to_object_id,
    basis,
    value_state,
    review_state
  ) values (
    'meridian-health',
    'assessment-smoke',
    '10000000-0000-0000-0000-000000000004',
    'SUPPLIED_BY',
    '99999999-9999-9999-9999-999999999999',
    'source_recorded',
    'known',
    'not_reviewed'
  );

  raise exception 'FK probe failed: missing relationship endpoint was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: missing relationship endpoint';
end $$;

do $$
begin
  insert into ecl_context.relationship (
    tenant_key,
    assessment_id,
    from_object_id,
    relationship_type,
    to_object_id,
    basis,
    value_state,
    review_state
  ) values (
    'meridian-health',
    'assessment-smoke',
    '10000000-0000-0000-0000-000000000004',
    'DEPENDS_ON',
    '10000000-0000-0000-0000-000000000004',
    'source_recorded',
    'known',
    'not_reviewed'
  );

  raise exception 'Check probe failed: relationship self-loop was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: relationship self-loop';
end $$;

do $$
begin
  insert into ecl_context.measure (
    tenant_key,
    assessment_id,
    subject_object_id,
    metric_key,
    value_number,
    unit,
    scenario,
    source_record_id,
    basis,
    value_state,
    quality_state,
    review_state
  ) values (
    'meridian-health',
    'assessment-smoke',
    '10000000-0000-0000-0000-000000000004',
    'annual_spend_usd',
    0,
    'USD',
    'actual',
    '10000000-0000-0000-0000-000000000002',
    'source_recorded',
    'unknown',
    'insufficient',
    'not_reviewed'
  );

  raise exception 'Check probe failed: unknown numeric zero was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: unknown is not zero';
end $$;

do $$
begin
  insert into ecl_commercial.contract (
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
    'meridian-health',
    'assessment-smoke',
    '99999999-9999-9999-9999-999999999998',
    '10000000-0000-0000-0000-000000000005',
    'Bad contract with missing contract object',
    1000000,
    'source_recorded',
    'known',
    'not_reviewed'
  );

  raise exception 'FK probe failed: missing contract object was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: missing contract object';
end $$;

do $$
begin
  insert into ecl_review.review_event (
    tenant_key,
    assessment_id,
    subject_kind,
    review_event_type,
    decision_basis
  ) values (
    'meridian-health',
    'assessment-smoke',
    'object',
    'confirm',
    'owner_confirmed'
  );

  raise exception 'Check probe failed: review event without subject was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: review event requires one subject';
end $$;

rollback;
