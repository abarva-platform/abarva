-- Drift repair: restore the `id` default on the enterprise_context_* tables.
--
-- The original DDL (20260430121500_apex_setup_data_layer.sql) defines
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- but the Supabase->Azure data-plane restore recreated these tables WITHOUT the
-- default, so the governed CSV-commit path failed with
--   "null value in column \"id\" of relation enterprise_context_chunks".
--
-- This migration is idempotent and order/set-independent: it SETs the default
-- only on tables that exist, and SET DEFAULT is a no-op when already correct.
-- It repairs drifted live databases and is harmless on fresh ones (where the
-- create-table default already matches).

BEGIN;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'enterprise_context_chunks',
    'enterprise_context_records',
    'enterprise_context_facts',
    'enterprise_context_source_files'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
