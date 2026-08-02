-- Correct the Foundation V3 source-register expectation.
--
-- The prior literal snapshot used an operational-file count. The expectation
-- is about intake data sources: registered tabular data, known unregistered
-- tabular support inputs, and declared absent sources. Workbook companions are
-- lineage artifacts for cell-level drill-through, not additional data sources.

BEGIN;

INSERT INTO operations.registered_query (
  query_ref,
  query_kind,
  query_version,
  query_sql,
  referenced_relations,
  output_shape,
  basis_mode,
  on_missing_input,
  authored_by,
  reviewed_by,
  metadata
)
VALUES (
  'qry-exp-source-register-file-count-v1',
  'expectation_basis',
  'v1',
  $query$
SELECT count(*)::int
FROM intake.expected_source
WHERE tenant_key = $1
  AND coalesce(arrival_state, 'expected') <> 'not_applicable'
$query$,
  ARRAY['intake.expected_source'],
  '{"type":"scalar_count","nullable":false}'::jsonb,
  'literal_snapshot',
  '{"when_relation_missing":"use_reviewed_literal_snapshot"}'::jsonb,
  'codex:foundation-v3-source-expectation-correction',
  'foundation-v3-source-expectation-review',
  jsonb_build_object(
    'correction_reason', 'prior_snapshot_counted_operational_files_not_intake_data_sources',
    'declared_registered_sources', 26,
    'declared_unregistered_tabular_sources', 3,
    'declared_absent_sources', 4,
    'excluded_workbook_lineage_companions', 5,
    'pending_relation_contract', 'intake.expected_source is authored at data-source grain; workbook lineage companions are excluded from expected_count until the intake contract declares companion roles explicitly'
  )
)
ON CONFLICT (query_ref, query_version)
DO UPDATE SET
  query_sql = EXCLUDED.query_sql,
  referenced_relations = EXCLUDED.referenced_relations,
  output_shape = EXCLUDED.output_shape,
  basis_mode = EXCLUDED.basis_mode,
  on_missing_input = EXCLUDED.on_missing_input,
  reviewed_by = EXCLUDED.reviewed_by,
  metadata = coalesce(operations.registered_query.metadata, '{}'::jsonb) || EXCLUDED.metadata;

INSERT INTO operations.design_expectation (
  tenant_key,
  expectation_ref,
  contract_version,
  stage_name,
  object_kind,
  object_scope,
  expectation_basis,
  expected_count,
  basis_mode,
  basis_query_ref,
  basis_query_version,
  basis_pending_relation,
  basis_referenced_relations,
  stage_write_relations,
  basis_source_layer,
  stage_write_layer,
  on_breach,
  implementation_scope,
  authored_by,
  reviewed_by,
  metadata
)
VALUES (
  'skyharbor-air',
  'exp-source-register-file-count-v1',
  'foundation-v3-conservation-warn-v0',
  'source-register',
  'source_file',
  jsonb_build_object('label', 'declared intake data sources excluding workbook lineage companions'),
  'declared_intake',
  33,
  'literal_snapshot',
  'qry-exp-source-register-file-count-v1',
  'v1',
  'intake.expected_source',
  ARRAY['intake.expected_source'],
  ARRAY['source_registry.source'],
  'intake',
  'source_registry',
  'warn',
  'active',
  'codex:foundation-v3-source-expectation-correction',
  'foundation-v3-source-expectation-review',
  jsonb_build_object(
    'correction_reason', 'prior_snapshot_counted_operational_files_not_intake_data_sources',
    'declared_registered_sources', 26,
    'declared_unregistered_tabular_sources', 3,
    'declared_absent_sources', 4,
    'excluded_workbook_lineage_companions', 5,
    'corrected_expected_count', 33,
    'pending_relation_contract', 'intake.expected_source is authored at data-source grain; workbook lineage companions are excluded from expected_count until the intake contract declares companion roles explicitly'
  )
)
ON CONFLICT (tenant_key, expectation_ref)
DO UPDATE SET
  object_scope = EXCLUDED.object_scope,
  expected_count = EXCLUDED.expected_count,
  basis_mode = EXCLUDED.basis_mode,
  basis_query_ref = EXCLUDED.basis_query_ref,
  basis_query_version = EXCLUDED.basis_query_version,
  basis_pending_relation = EXCLUDED.basis_pending_relation,
  basis_referenced_relations = EXCLUDED.basis_referenced_relations,
  stage_write_relations = EXCLUDED.stage_write_relations,
  basis_source_layer = EXCLUDED.basis_source_layer,
  stage_write_layer = EXCLUDED.stage_write_layer,
  on_breach = 'warn',
  reviewed_by = EXCLUDED.reviewed_by,
  metadata = coalesce(operations.design_expectation.metadata, '{}'::jsonb) || EXCLUDED.metadata;

COMMIT;
