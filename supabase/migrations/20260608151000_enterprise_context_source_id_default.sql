-- Restore the UUID default on enterprise_context_sources.id.
--
-- The Supabase-to-Azure restore path previously repaired defaults for chunks,
-- source_files, records, and facts but missed enterprise_context_sources. Admin
-- structured promotion now writes deterministic IDs, but this keeps the live
-- schema aligned with the original Enterprise Context DDL and protects any
-- other governed writer that relies on the table default.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_sources') IS NOT NULL THEN
    ALTER TABLE public.enterprise_context_sources
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

COMMIT;
