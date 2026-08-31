-- Tower runtime reader role.
--
-- The projection tables already have tenant-scoped SELECT policies. This migration makes those
-- policies exercisable by the Tower read path without rotating the shared database password:
-- the application connection can SET ROLE into this no-login, non-bypass reader role, and the
-- serving views execute as the invoker so base-table RLS is evaluated against that reader.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tower_projection_reader') THEN
    CREATE ROLE tower_projection_reader
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      NOINHERIT;
  END IF;

  BEGIN
    ALTER ROLE tower_projection_reader
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      NOINHERIT;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping tower_projection_reader attribute hardening; readback must verify non-BYPASSRLS execution before enforcement.';
  END;
END $$;

GRANT USAGE ON SCHEMA ecl_projection TO tower_projection_reader;
GRANT USAGE ON SCHEMA serving TO tower_projection_reader;

DO $$
DECLARE
  rel regclass;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'ecl_projection.tower_ai_portfolio'::regclass,
    'ecl_projection.tower_assessment_lifecycle'::regclass,
    'ecl_projection.tower_command_center'::regclass,
    'ecl_projection.tower_evidence_queue'::regclass,
    'ecl_projection.tower_value_chain'::regclass
  ]
  LOOP
    EXECUTE format('GRANT SELECT ON %s TO tower_projection_reader', rel);
  END LOOP;
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA serving TO tower_projection_reader;

DO $$
DECLARE
  view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY[
    'tower_adoption_lens',
    'tower_ai_portfolio',
    'tower_command_center',
    'tower_cost_lens',
    'tower_decision_lanes',
    'tower_evidence',
    'tower_recommended_actions',
    'tower_risk_lens',
    'tower_value_proof'
  ]
  LOOP
    IF to_regclass('serving.' || view_name) IS NOT NULL THEN
      EXECUTE format('ALTER VIEW serving.%I SET (security_invoker = true)', view_name);
      EXECUTE format('GRANT SELECT ON serving.%I TO tower_projection_reader', view_name);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  EXECUTE format('GRANT tower_projection_reader TO %I', current_user);
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'abarvaadmin') THEN
    GRANT tower_projection_reader TO abarvaadmin;
  END IF;
END $$;

COMMENT ON ROLE tower_projection_reader IS
  'No-login, non-BYPASSRLS read role for Tower serving views; application sessions SET LOCAL ROLE before tenant-scoped reads.';

COMMIT;
