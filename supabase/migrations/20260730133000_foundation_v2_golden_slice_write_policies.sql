-- Foundation V2 isolated golden-slice writer policy.
--
-- Scope:
--   Adds a no-login writer role and tenant/test-namespace INSERT policies for
--   the isolated foundation_v2 proof schema. This does not grant access to V1
--   schemas, live publications, active baselines, production providers, or
--   product routes.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foundation_v2_golden_slice_writer') THEN
    CREATE ROLE foundation_v2_golden_slice_writer NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA foundation_v2 TO foundation_v2_golden_slice_writer;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA foundation_v2 TO foundation_v2_golden_slice_writer;

DO $$
DECLARE
  rel regclass;
  rel_name text;
  release_check text;
  state_check text;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2.source_releases'::regclass,
    'foundation_v2.source_files'::regclass,
    'foundation_v2.source_records'::regclass,
    'foundation_v2.source_field_values'::regclass,
    'foundation_v2.parser_executions'::regclass,
    'foundation_v2.normalized_objects'::regclass,
    'foundation_v2.knowledge_candidates'::regclass,
    'foundation_v2.review_batches'::regclass,
    'foundation_v2.review_decisions'::regclass,
    'foundation_v2.canonical_objects'::regclass,
    'foundation_v2.domain_publications'::regclass,
    'foundation_v2.publication_members'::regclass,
    'foundation_v2.baselines'::regclass,
    'foundation_v2.baseline_object_memberships'::regclass,
    'foundation_v2.projection_authority'::regclass,
    'foundation_v2.projection_rows'::regclass,
    'foundation_v2.projection_field_lineage'::regclass,
    'foundation_v2.cube_parity_results'::regclass,
    'foundation_v2.product_binding_proofs'::regclass,
    'foundation_v2.ava_packet_proofs'::regclass,
    'foundation_v2.gate_results'::regclass
  ]
  LOOP
    rel_name := split_part(rel::text, '.', 2);
    release_check := '';
    state_check := '';

    IF EXISTS (
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'foundation_v2'
         AND table_name = rel_name
         AND column_name = 'source_release_id'
    ) THEN
      release_check := ' AND source_release_id = ''airline-demo-new-foundation-v2-golden-slice-v1''
                         AND source_release_id = current_setting(''app.foundation_v2_source_release_id'', true)';
    END IF;

    IF rel_name = 'source_releases' THEN
      state_check := ' AND source_release_id = ''airline-demo-new-foundation-v2-golden-slice-v1''
                       AND source_release_state = ''isolated_golden_slice''
                       AND isolation_scope = ''ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY''';
    ELSIF rel_name = 'review_batches' THEN
      state_check := ' AND batch_state = ''approved_for_golden_slice''';
    ELSIF rel_name = 'domain_publications' THEN
      state_check := ' AND publication_state = ''isolated_test''';
    ELSIF rel_name = 'baselines' THEN
      state_check := ' AND baseline_state = ''isolated_test''';
    ELSIF rel_name = 'projection_authority' THEN
      state_check := ' AND projection_name = ''golden_slice_knowledge_preview''
                       AND freshness_state = ''fresh''';
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS foundation_v2_tenant_insert ON %s', rel);
    EXECUTE format(
      'CREATE POLICY foundation_v2_tenant_insert ON %s
         FOR INSERT
         TO foundation_v2_golden_slice_writer
         WITH CHECK (
           tenant_key = ''skyharbor-air''
           AND tenant_key = current_setting(''app.tenant_key'', true)
           AND test_namespace = ''foundation-v2-golden-slice-v1''
           AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)
           AND current_setting(''app.foundation_v2_source_release_id'', true) = ''airline-demo-new-foundation-v2-golden-slice-v1''
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''airline-demo-new''
           %s
           %s
         )',
      rel,
      release_check,
      state_check
    );
  END LOOP;
END $$;

COMMENT ON ROLE foundation_v2_golden_slice_writer IS
  'No-login role for isolated Foundation V2 golden-slice INSERT policies only; membership is granted outside this migration by governed identity mapping.';

COMMIT;
