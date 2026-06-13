-- Enterprise Context chunk lifecycle contract.
--
-- Search and runtime retrieval must be able to prove that only current/active
-- chunks enter agent context. Facts/records already carry lifecycle_state; this
-- additive migration gives enterprise_context_chunks the same current-view
-- contract and indexes it for active-only Search backfills.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_chunks') IS NULL THEN
    RAISE NOTICE 'enterprise_context_chunks absent; skipping chunk lifecycle migration.';
    RETURN;
  END IF;

  ALTER TABLE public.enterprise_context_chunks
    ADD COLUMN IF NOT EXISTS lifecycle_state TEXT;

  UPDATE public.enterprise_context_chunks
     SET lifecycle_state = 'active'
   WHERE lifecycle_state IS NULL;

  ALTER TABLE public.enterprise_context_chunks
    ALTER COLUMN lifecycle_state SET DEFAULT 'active';

  ALTER TABLE public.enterprise_context_chunks
    ALTER COLUMN lifecycle_state SET NOT NULL;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'enterprise_context_chunks_lifecycle_state_check'
       AND conrelid = 'public.enterprise_context_chunks'::regclass
  ) THEN
    ALTER TABLE public.enterprise_context_chunks
      ADD CONSTRAINT enterprise_context_chunks_lifecycle_state_check
      CHECK (lifecycle_state IN ('active', 'superseded', 'inactive', 'retired'));
  END IF;

  CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_tenant_lifecycle
    ON public.enterprise_context_chunks (tenant_key, lifecycle_state);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
