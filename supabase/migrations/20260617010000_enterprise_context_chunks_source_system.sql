-- Add source_system lineage to enterprise_context_chunks.
-- The context read model groups chunk coverage by source_system; older lab
-- databases had records/facts/evidence lineage but not chunk-level lineage.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_chunks') IS NULL THEN
    RAISE NOTICE 'enterprise_context_chunks absent; skipping source_system lineage migration.';
    RETURN;
  END IF;

  ALTER TABLE public.enterprise_context_chunks
    ADD COLUMN IF NOT EXISTS source_system TEXT;

  IF to_regclass('public.enterprise_context_records') IS NOT NULL THEN
    UPDATE public.enterprise_context_chunks c
       SET source_system = r.source_system
      FROM public.enterprise_context_records r
     WHERE c.source_system IS NULL
       AND c.tenant_key = r.tenant_key
       AND c.source_record_id = r.source_record_id;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_tenant_source_system
    ON public.enterprise_context_chunks (tenant_key, source_system)
    WHERE source_system IS NOT NULL;
END $$;

COMMIT;
