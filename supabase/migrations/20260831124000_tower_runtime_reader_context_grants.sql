-- Tower runtime reader context grants.
--
-- Tower serving views now execute as the invoker so base-table RLS is exercised by the
-- no-bypass runtime reader role. The value-chain row function enriches its payload from
-- the canonical measure table, so the reader also needs the minimal context grant for that
-- read-only dependency.

BEGIN;

GRANT USAGE ON SCHEMA ecl_context TO tower_projection_reader;

DO $$
BEGIN
  IF to_regclass('ecl_context.measure') IS NOT NULL THEN
    GRANT SELECT ON ecl_context.measure TO tower_projection_reader;
  END IF;
END $$;

COMMIT;
