-- ECL cube negative probe v1.
-- Run only in a disposable database after the positive cube smoke chain.
-- Expected result: this script completes because each bad insert is rejected.

begin;

do $$
begin
  insert into ecl_projection.cube_manifest (
    tenant_key,
    assessment_id,
    snapshot_id,
    cube_key,
    cube_version,
    rebuild_command,
    source_hash,
    cube_hash,
    slice_count,
    quality_state,
    admission_status,
    admission_gate_results_json,
    proof_uri
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '30000000-0000-0000-0000-000000000070',
    'architecture_cube',
    2,
    'job-ecl-cube-build-positive-smoke --cube architecture_cube',
    'source-hash-positive-smoke',
    'cube-hash-bad-admission-positive-smoke',
    1,
    'passed',
    'admitted',
    '[{"gate":"end_to_end_data_flow","status":"refused"}]'::jsonb,
    'azure://example/ecl-positive-smoke/proof/cubes/bad-admission'
  );

  raise exception 'Check probe failed: admitted cube manifest with refusal payload was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: admitted cube manifest cannot carry refusal payload';
end $$;

do $$
begin
  insert into ecl_projection.cube_slice (
    tenant_key,
    assessment_id,
    snapshot_id,
    cube_manifest_id,
    cube_key,
    cube_version,
    slice_key,
    grain_key,
    dimensions_json,
    measures_json,
    primary_metric_key,
    basis_summary,
    value_state,
    quality_state,
    source_hash
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '30000000-0000-0000-0000-000000000070',
    '99999999-9999-9999-9999-999999999999',
    'home_coverage_cube',
    1,
    'bad-missing-manifest',
    'domain',
    '{"domain":"Health Plan Operations"}'::jsonb,
    '{"objects":1}'::jsonb,
    'object_count',
    'source_recorded',
    'known',
    'passed',
    'source-hash-positive-smoke'
  );

  raise exception 'FK probe failed: cube slice without manifest was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: cube slice requires manifest FK';
end $$;

do $$
begin
  insert into ecl_projection.cube_slice (
    tenant_key,
    assessment_id,
    snapshot_id,
    cube_manifest_id,
    cube_key,
    cube_version,
    slice_key,
    grain_key,
    dimensions_json,
    measures_json,
    primary_metric_key,
    basis_summary,
    value_state,
    quality_state,
    gap_flags_json,
    source_hash
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '30000000-0000-0000-0000-000000000070',
    '40000000-0000-0000-0000-000000000001',
    'home_coverage_cube',
    1,
    'bad-blocked-without-gap',
    'domain',
    '{"domain":"Health Plan Operations"}'::jsonb,
    '{"objects":1}'::jsonb,
    'object_count',
    'source_recorded',
    'known',
    'blocked',
    '[]'::jsonb,
    'source-hash-positive-smoke'
  );

  raise exception 'Check probe failed: blocked cube slice without gap flags was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: blocked cube slice requires gap flags';
end $$;

do $$
begin
  insert into ecl_projection.cube_slice (
    tenant_key,
    assessment_id,
    snapshot_id,
    cube_manifest_id,
    cube_key,
    cube_version,
    slice_key,
    grain_key,
    dimensions_json,
    measures_json,
    primary_metric_key,
    basis_summary,
    value_state,
    quality_state,
    source_hash
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '30000000-0000-0000-0000-000000000070',
    '40000000-0000-0000-0000-000000000001',
    'home_coverage_cube',
    1,
    'bad-empty-measures',
    'domain',
    '{"domain":"Health Plan Operations"}'::jsonb,
    '{}'::jsonb,
    'object_count',
    'source_recorded',
    'known',
    'passed',
    'source-hash-positive-smoke'
  );

  raise exception 'Check probe failed: cube slice without measures was accepted';
exception
  when check_violation then
    raise notice 'Expected check rejection: cube slice requires measures';
end $$;

do $$
begin
  insert into ecl_projection.cube_slice (
    tenant_key,
    assessment_id,
    snapshot_id,
    cube_manifest_id,
    cube_key,
    cube_version,
    slice_key,
    grain_key,
    dimensions_json,
    measures_json,
    primary_metric_key,
    basis_summary,
    value_state,
    quality_state,
    source_hash
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '30000000-0000-0000-0000-000000000070',
    '40000000-0000-0000-0000-000000000001',
    'home_coverage_cube',
    1,
    'bad-invented-primary-metric',
    'domain',
    '{"domain":"Health Plan Operations"}'::jsonb,
    '{"objects":1}'::jsonb,
    'totally_invented_metric_that_does_not_exist',
    'source_recorded',
    'known',
    'passed',
    'source-hash-positive-smoke'
  );

  raise exception 'FK probe failed: invented primary metric was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: cube slice primary metric requires metric_definition';
end $$;

do $$
begin
  insert into ecl_projection.cube_slice_metric (
    tenant_key,
    assessment_id,
    cube_slice_id,
    metric_key,
    metric_role,
    source_hash
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '40000000-0000-0000-0000-000000000010',
    'totally_invented_metric_that_does_not_exist',
    'display',
    'source-hash-positive-smoke'
  );

  raise exception 'FK probe failed: invented cube metric was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: cube slice metric requires metric_definition';
end $$;

do $$
begin
  insert into ecl_projection.cube_slice_measure (
    tenant_key,
    assessment_id,
    cube_slice_id,
    measure_id,
    metric_key,
    measure_role,
    source_hash
  ) values (
    'meridian-health',
    'assessment-positive-smoke',
    '40000000-0000-0000-0000-000000000012',
    '99999999-9999-9999-9999-999999999999',
    'report_count',
    'display',
    'source-hash-positive-smoke'
  );

  raise exception 'FK probe failed: invented cube measure was accepted';
exception
  when foreign_key_violation then
    raise notice 'Expected FK rejection: cube slice measure requires ecl_context.measure';
end $$;

rollback;
