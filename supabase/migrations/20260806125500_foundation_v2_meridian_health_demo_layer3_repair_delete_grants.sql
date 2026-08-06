BEGIN;

GRANT DELETE ON foundation_v2_meridian_health_demo.canonical_entities TO foundation_v2_meridian_health_demo_writer;
GRANT DELETE ON foundation_v2_meridian_health_demo.canonical_observations TO foundation_v2_meridian_health_demo_writer;
GRANT DELETE ON foundation_v2_meridian_health_demo.canonical_relationships TO foundation_v2_meridian_health_demo_writer;
GRANT DELETE ON foundation_v2_meridian_health_demo.canonical_evidence_records TO foundation_v2_meridian_health_demo_writer;
GRANT DELETE ON foundation_v2_meridian_health_demo.event_native_records TO foundation_v2_meridian_health_demo_writer;
GRANT DELETE ON foundation_v2_meridian_health_demo.canonical_promotion_decisions TO foundation_v2_meridian_health_demo_writer;
GRANT DELETE ON foundation_v2_meridian_health_demo.gate_results TO foundation_v2_meridian_health_demo_writer;

DO $$
DECLARE
  rel regclass;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2_meridian_health_demo.canonical_entities'::regclass,
    'foundation_v2_meridian_health_demo.canonical_observations'::regclass,
    'foundation_v2_meridian_health_demo.canonical_relationships'::regclass,
    'foundation_v2_meridian_health_demo.canonical_evidence_records'::regclass,
    'foundation_v2_meridian_health_demo.event_native_records'::regclass,
    'foundation_v2_meridian_health_demo.canonical_promotion_decisions'::regclass
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS meridian_health_demo_delete ON %s', rel);
    EXECUTE format(
      'CREATE POLICY meridian_health_demo_delete ON %s
         FOR DELETE
         TO foundation_v2_meridian_health_demo_writer
         USING (
           tenant_key = ''meridian_health_global''
           AND tenant_key = current_setting(''app.tenant_key'', true)
           AND test_namespace = ''meridian-health-source-volume-v1''
           AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)
           AND source_release_id = ''meridian-health-source-v1-202608:source-volume-v1:447910ac3c16''
           AND source_release_id = current_setting(''app.foundation_v2_source_release_id'', true)
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''meridian-health-demo-phase-a-source-volume-v1''
         )',
      rel
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS meridian_health_demo_delete ON foundation_v2_meridian_health_demo.gate_results;
CREATE POLICY meridian_health_demo_delete ON foundation_v2_meridian_health_demo.gate_results
  FOR DELETE
  TO foundation_v2_meridian_health_demo_writer
  USING (
    tenant_key = 'meridian_health_global'
    AND tenant_key = current_setting('app.tenant_key', true)
    AND test_namespace = 'meridian-health-source-volume-v1'
    AND test_namespace = current_setting('app.foundation_v2_test_namespace', true)
    AND gate_id = ANY(ARRAY[
      'Meridian Health-L3-K3A-IDENTITY-CONSOLIDATION',
      'Meridian Health-L3-K3B-OBSERVATION-RELATIONSHIP-GRAIN',
      'Meridian Health-L3-K3C-CANDIDATE-DECISION-COVERAGE',
      'Meridian Health-L3-K3D-CANONICAL-BOUNDARY'
    ])
    AND current_setting('app.foundation_v2_source_release_id', true) = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true) = 'meridian-health-demo-phase-a-source-volume-v1'
  );

COMMENT ON POLICY meridian_health_demo_delete ON foundation_v2_meridian_health_demo.canonical_promotion_decisions IS
  'Allows the restricted Meridian Health writer to replay Layer 3 after a failed semantic identity gate; rows remain fenced by tenant, namespace and source release.';
COMMENT ON POLICY meridian_health_demo_delete ON foundation_v2_meridian_health_demo.gate_results IS
  'Allows the restricted Meridian Health writer to clear Layer 3 gate rows during an approved same-release replay.';

COMMIT;
