\set ON_ERROR_STOP on

BEGIN;

SELECT set_config('app.tenant_key', 'airline-demo-new', true);

CREATE ROLE airdn_rls_probe NOLOGIN;
GRANT airdn_rls_probe TO airdn_admin;
GRANT USAGE ON SCHEMA operations TO airdn_rls_probe;
GRANT SELECT, INSERT ON operations.run TO airdn_rls_probe;

SET ROLE airdn_rls_probe;
SELECT set_config('app.tenant_key', 'airline-demo-new', false);

INSERT INTO operations.run (
  tenant_key,
  run_ref,
  release_id,
  idempotency_key,
  run_type,
  run_state,
  actor_ref
) VALUES (
  'airline-demo-new',
  'rls-probe-run',
  'airline-demo-new-zero-data-fixture',
  'rls-probe-idempotency',
  'rls_probe',
  'passed',
  'airdn_rls_probe'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO operations.run (
      tenant_key,
      run_ref,
      release_id,
      idempotency_key,
      run_type,
      run_state,
      actor_ref
    ) VALUES (
      'blocked-cross-tenant',
      'rls-probe-blocked-run',
      'airline-demo-new-zero-data-fixture',
      'rls-probe-blocked-idempotency',
      'rls_probe',
      'passed',
      'airdn_rls_probe'
    );

    RAISE EXCEPTION 'RLS cross-tenant insert was not blocked';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'rls_cross_tenant_insert_blocked=true';
  END;
END $$;

RESET ROLE;

INSERT INTO operations.run (
  tenant_key,
  run_ref,
  release_id,
  idempotency_key,
  run_type,
  run_state,
  actor_ref,
  started_at,
  completed_at,
  metadata
) VALUES (
  'airline-demo-new',
  'fixture-run',
  'airline-demo-new-zero-data-fixture',
  'fixture-idempotency',
  'generic_projection_conformance',
  'passed',
  'controlled-zero-data-certification',
  now(),
  now(),
  '{"fixture_only":true,"source_landing":false}'::jsonb
);

INSERT INTO knowledge.relationship_type (
  relationship_type_ref,
  display_name,
  from_entity_type,
  to_entity_type,
  active,
  description
) VALUES (
  'supports_fixture',
  'supports',
  'capability',
  'system',
  true,
  'Generic conformance relationship type used only inside rollback fixture.'
);

INSERT INTO knowledge.entity (
  tenant_key,
  entity_ref,
  entity_type,
  display_name,
  authority_state,
  availability_state,
  freshness_state,
  accepted_evidence_refs,
  content_hash,
  created_run_ref
) VALUES
  (
    'airline-demo-new',
    'fixture-capability',
    'capability',
    'Generic capability fixture',
    'accepted',
    'accepted',
    'fresh',
    ARRAY['fixture-evidence'],
    'fixture-capability-hash',
    'fixture-run'
  ),
  (
    'airline-demo-new',
    'fixture-system',
    'system',
    'Generic system fixture',
    'accepted',
    'accepted',
    'fresh',
    ARRAY['fixture-evidence'],
    'fixture-system-hash',
    'fixture-run'
  );

INSERT INTO knowledge.relationship_assertion (
  tenant_key,
  relationship_ref,
  from_entity_ref,
  to_entity_ref,
  relationship_type_ref,
  current_target_state,
  authority_state,
  availability_state,
  freshness_state,
  evidence_refs,
  relationship_payload,
  content_hash
) VALUES (
  'airline-demo-new',
  'fixture-relationship',
  'fixture-capability',
  'fixture-system',
  'supports_fixture',
  'current',
  'accepted',
  'accepted',
  'fresh',
  ARRAY['fixture-evidence'],
  '{"fixture_only":true}'::jsonb,
  'fixture-relationship-hash'
);

INSERT INTO publication.domain_publication (
  tenant_key,
  domain_publication_ref,
  domain_ref,
  release_id,
  publication_state,
  source_content_hash,
  accepted_entity_count,
  accepted_fact_count,
  accepted_relationship_count,
  critical_gap_count,
  created_run_ref
) VALUES (
  'airline-demo-new',
  'fixture-domain-publication',
  'generic-conformance',
  'airline-demo-new-zero-data-fixture',
  'passed',
  'fixture-source-hash',
  2,
  0,
  1,
  0,
  'fixture-run'
);

INSERT INTO publication.knowledge_baseline (
  tenant_key,
  knowledge_baseline_ref,
  release_id,
  baseline_state,
  is_active,
  domain_publication_refs,
  baseline_content_hash,
  projection_validation_hash,
  activated_run_ref
) VALUES (
  'airline-demo-new',
  'fixture-knowledge-baseline',
  'airline-demo-new-zero-data-fixture',
  'passed',
  false,
  ARRAY['fixture-domain-publication'],
  'fixture-baseline-hash',
  'fixture-validation-hash',
  'fixture-run'
);

SELECT publication.activate_knowledge_baseline(
  'airline-demo-new',
  'fixture-knowledge-baseline',
  'fixture-activation',
  'fixture-run'
);

INSERT INTO consumption.enterprise_brief_v1 (
  tenant_key,
  knowledge_baseline_ref,
  domain_publication_ref,
  projection_contract_version,
  as_of_date,
  authority_state,
  freshness_state,
  availability_state,
  evidence_coverage,
  content_hash,
  object_ref,
  display_name,
  executive_summary,
  payload
) VALUES (
  'airline-demo-new',
  'fixture-knowledge-baseline',
  'fixture-domain-publication',
  'v1',
  current_date,
  'accepted',
  'fresh',
  'available',
  1.0000,
  'fixture-brief-hash',
  'fixture-enterprise-brief',
  'Generic zero-data conformance brief',
  'Generic fixture proves the read-model shape without landing source facts.',
  '{"fixture_only":true}'::jsonb
);

INSERT INTO consumption.relationship_node_v1 (
  tenant_key,
  knowledge_baseline_ref,
  domain_publication_ref,
  projection_contract_version,
  as_of_date,
  authority_state,
  freshness_state,
  availability_state,
  evidence_coverage,
  content_hash,
  node_ref,
  entity_ref,
  node_type,
  label,
  current_target_state,
  payload
) VALUES
  (
    'airline-demo-new',
    'fixture-knowledge-baseline',
    'fixture-domain-publication',
    'v1',
    current_date,
    'accepted',
    'fresh',
    'available',
    1.0000,
    'fixture-node-capability-hash',
    'fixture-node-capability',
    'fixture-capability',
    'capability',
    'Generic capability fixture',
    'current',
    '{"fixture_only":true}'::jsonb
  ),
  (
    'airline-demo-new',
    'fixture-knowledge-baseline',
    'fixture-domain-publication',
    'v1',
    current_date,
    'accepted',
    'fresh',
    'available',
    1.0000,
    'fixture-node-system-hash',
    'fixture-node-system',
    'fixture-system',
    'system',
    'Generic system fixture',
    'current',
    '{"fixture_only":true}'::jsonb
  );

INSERT INTO consumption.relationship_edge_v1 (
  tenant_key,
  knowledge_baseline_ref,
  domain_publication_ref,
  projection_contract_version,
  as_of_date,
  authority_state,
  freshness_state,
  availability_state,
  evidence_coverage,
  content_hash,
  edge_ref,
  from_node_ref,
  to_node_ref,
  relationship_type_ref,
  current_target_state,
  evidence_refs,
  payload
) VALUES (
  'airline-demo-new',
  'fixture-knowledge-baseline',
  'fixture-domain-publication',
  'v1',
  current_date,
  'accepted',
  'fresh',
  'available',
  1.0000,
  'fixture-edge-hash',
  'fixture-edge',
  'fixture-node-capability',
  'fixture-node-system',
  'supports_fixture',
  'current',
  ARRAY['fixture-evidence'],
  '{"fixture_only":true}'::jsonb
);

INSERT INTO consumption.relationship_evidence_v1 (
  tenant_key,
  knowledge_baseline_ref,
  edge_ref,
  evidence_ref,
  citation_label,
  source_ref,
  source_version_ref,
  evidence_text,
  evidence_hash,
  authority_state
) VALUES (
  'airline-demo-new',
  'fixture-knowledge-baseline',
  'fixture-edge',
  'fixture-evidence',
  'Generic fixture evidence',
  null,
  null,
  'Rollback-only fixture evidence.',
  'fixture-evidence-hash',
  'accepted'
);

SELECT 'relationship_validation=' || jsonb_agg(to_jsonb(v) ORDER BY check_name)::text
FROM consumption.validate_relationship_publication_v1(
  'airline-demo-new',
  'fixture-knowledge-baseline'
) v;

SELECT 'relationship_neighbor_count=' || count(*)
FROM consumption.relationship_neighbors_v1(
  'airline-demo-new',
  'fixture-knowledge-baseline',
  'fixture-node-capability',
  2,
  10,
  'current'
);

SELECT 'active_baselines_inside_fixture=' || count(*)
FROM publication.knowledge_baseline
WHERE tenant_key = 'airline-demo-new'
  AND is_active = true;

ROLLBACK;

SELECT 'fixture_rows_after_rollback=' || count(*)
FROM operations.run
WHERE tenant_key = 'airline-demo-new'
  AND run_ref IN ('rls-probe-run', 'fixture-run');
