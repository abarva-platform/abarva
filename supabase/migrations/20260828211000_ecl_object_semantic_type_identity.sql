BEGIN;

DO $$
DECLARE
  old_constraint_name text;
BEGIN
  IF to_regclass('ecl_context.object') IS NULL THEN
    RAISE NOTICE 'Skipping ECL object semantic type identity migration because ecl_context.object does not exist.';
    RETURN;
  END IF;

  EXECUTE $ddl$
    ALTER TABLE ecl_context.object
      ADD COLUMN IF NOT EXISTS canonical_semantic_type text
      GENERATED ALWAYS AS (
        coalesce(nullif(attributes_json ->> 'canonical_semantic_type', ''), object_type)
      ) STORED
  $ddl$;

  FOR old_constraint_name IN
    SELECT c.conname
      FROM pg_constraint c
      JOIN LATERAL (
        SELECT array_agg(a.attname ORDER BY keys.ord) AS key_columns
          FROM unnest(c.conkey) WITH ORDINALITY AS keys(attnum, ord)
          JOIN pg_attribute a
            ON a.attrelid = c.conrelid
           AND a.attnum = keys.attnum
      ) columns ON true
     WHERE c.conrelid = 'ecl_context.object'::regclass
       AND c.contype = 'u'
       AND columns.key_columns = ARRAY[
         'tenant_key',
         'assessment_id',
         'object_type',
         'object_key'
       ]::name[]
  LOOP
    EXECUTE format('ALTER TABLE ecl_context.object DROP CONSTRAINT %I', old_constraint_name);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'ecl_context.object'::regclass
       AND conname = 'object_canonical_semantic_type_check'
  ) THEN
    EXECUTE $ddl$
      ALTER TABLE ecl_context.object
        ADD CONSTRAINT object_canonical_semantic_type_check
        CHECK (canonical_semantic_type <> '')
    $ddl$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'ecl_context.object'::regclass
       AND conname = 'object_semantic_key_unique'
  ) THEN
    EXECUTE $ddl$
      ALTER TABLE ecl_context.object
        ADD CONSTRAINT object_semantic_key_unique
        UNIQUE (
          tenant_key,
          assessment_id,
          object_type,
          canonical_semantic_type,
          object_key
        )
    $ddl$;
  END IF;

  EXECUTE $ddl$
    CREATE INDEX IF NOT EXISTS idx_ecl_context_object_semantic_type
      ON ecl_context.object (
        tenant_key,
        assessment_id,
        canonical_semantic_type
      )
  $ddl$;
END $$;

COMMIT;
