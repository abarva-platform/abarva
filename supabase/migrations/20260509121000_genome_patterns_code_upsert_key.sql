-- Make genome_patterns.code usable as a Supabase/PostgREST upsert key.
-- Postgres permits multiple NULL values in a unique index, so this remains
-- compatible with legacy JSONB-only rows.

BEGIN;

DROP INDEX IF EXISTS idx_genome_patterns_code_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_genome_patterns_code_unique
  ON genome_patterns(code);

NOTIFY pgrst, 'reload schema';

COMMIT;
