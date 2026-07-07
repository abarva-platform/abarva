-- Classification triage columns for enterprise_context_records.
--
-- Operators use the /admin/context-layer/triage route to confirm domain
-- classification for records that arrive with classification_source =
-- 'NEEDS_CLASSIFICATION'. Once confirmed, records move to lifecycle_state =
-- 'active' with classification_source = 'OPERATOR_CONFIRMED'.
--
-- This migration is additive and idempotent; existing rows are unaffected.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_records') IS NULL THEN
    RAISE NOTICE 'enterprise_context_records absent; skipping classification triage migration.';
    RETURN;
  END IF;

  -- Classification-triage metadata columns (all nullable for back-compat).
  ALTER TABLE public.enterprise_context_records
    ADD COLUMN IF NOT EXISTS domain_segment       TEXT,
    ADD COLUMN IF NOT EXISTS business_function    TEXT,
    ADD COLUMN IF NOT EXISTS criticality          TEXT,
    ADD COLUMN IF NOT EXISTS classification_source TEXT;

  -- Extend lifecycle_state constraint to include 'review'.
  -- Drop existing check if it only covers the original three values, then
  -- recreate it with the extended set. Use IF EXISTS guard for idempotency.
  IF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'enterprise_context_records_lifecycle_state_check'
       AND conrelid = 'public.enterprise_context_records'::regclass
  ) THEN
    ALTER TABLE public.enterprise_context_records
      DROP CONSTRAINT enterprise_context_records_lifecycle_state_check;
  END IF;

  ALTER TABLE public.enterprise_context_records
    ADD CONSTRAINT enterprise_context_records_lifecycle_state_check
    CHECK (lifecycle_state IN ('active', 'superseded', 'inactive', 'review'));

  -- Index for triage queue: tenant + classification_source + lifecycle_state.
  CREATE INDEX IF NOT EXISTS idx_ecr_tenant_classification_triage
    ON public.enterprise_context_records (tenant_key, classification_source, lifecycle_state)
    WHERE classification_source = 'NEEDS_CLASSIFICATION';

END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
