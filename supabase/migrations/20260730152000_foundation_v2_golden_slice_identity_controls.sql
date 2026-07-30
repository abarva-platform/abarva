-- Foundation V2 isolated golden-slice identity controls.
--
-- Scope:
--   Tighten the already-approved Foundation V2 golden-slice proof schema for
--   dedicated non-BYPASSRLS operator identities. This migration does not create
--   login principals, mutate V1 data, publish domains, activate baselines,
--   switch providers, or load augmentation.

BEGIN;

ALTER ROLE foundation_v2_golden_slice_writer
  NOLOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS
  NOINHERIT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foundation_v2_golden_slice_reader') THEN
    CREATE ROLE foundation_v2_golden_slice_reader
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      NOINHERIT;
  END IF;
END $$;

ALTER ROLE foundation_v2_golden_slice_reader
  NOLOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS
  NOINHERIT;

GRANT USAGE ON SCHEMA foundation_v2 TO foundation_v2_golden_slice_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA foundation_v2 TO foundation_v2_golden_slice_reader;

DO $$
BEGIN
  IF to_regclass('schema_migrations') IS NOT NULL THEN
    GRANT SELECT ON schema_migrations TO foundation_v2_golden_slice_reader;
  END IF;
END $$;

DO $$
DECLARE
  rel regclass;
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
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', rel);
  END LOOP;
END $$;

COMMENT ON ROLE foundation_v2_golden_slice_writer IS
  'No-login NOINHERIT writer role for isolated Foundation V2 golden-slice INSERT policies only; dedicated login principal must SET ROLE explicitly.';

COMMENT ON ROLE foundation_v2_golden_slice_reader IS
  'No-login NOINHERIT read-only role for independent Foundation V2 golden-slice verification under tenant/test-namespace RLS.';

COMMIT;
