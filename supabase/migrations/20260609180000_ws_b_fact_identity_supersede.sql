-- Workstream B · idempotent fact identity + supersede.
--
-- Defect (WS0 discovery): a CHANGED fact value inserted a SECOND row while the
-- prior row stayed lifecycle_state='active' (the UNIQUE key included value_hash),
-- producing two active rows for one logical fact. This migration:
--   1. adds load_batch_id to facts + chunks (load lineage),
--   2. collapses any pre-existing duplicate ACTIVE facts (idempotent, safe on
--      dirty data — keeps the most recent per logical fact, supersedes the rest),
--   3. enforces ONE active row per logical fact via a partial unique index.
--
-- Defensive: every statement is guarded on the target table existing, so the
-- migration applies on the real Azure data plane and is a safe no-op in any
-- replay environment where the enterprise_context tables are not yet present.
-- The loader (admin-structured-context-promotion.ts) supersedes the prior active
-- fact before upserting the new value. Live replay is validated on ACA.

BEGIN;

DO $ws_b_facts$
BEGIN
  IF to_regclass('public.enterprise_context_facts') IS NULL THEN
    RAISE NOTICE 'ws-b: enterprise_context_facts absent; skipping fact identity hardening (applies when the table exists).';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.enterprise_context_facts ADD COLUMN IF NOT EXISTS load_batch_id TEXT';

  -- Collapse pre-existing duplicate active facts: keep the most recently updated
  -- row per (tenant_key, record_id, fact_key); supersede the older duplicates.
  EXECUTE $sql$
    WITH ranked AS (
      SELECT id,
             row_number() OVER (
               PARTITION BY tenant_key, record_id, fact_key
               ORDER BY updated_at DESC, created_at DESC, id DESC
             ) AS rn
      FROM public.enterprise_context_facts
      WHERE lifecycle_state = 'active'
    )
    UPDATE public.enterprise_context_facts AS f
    SET lifecycle_state = 'superseded',
        updated_at = now()
    FROM ranked
    WHERE f.id = ranked.id
      AND ranked.rn > 1
  $sql$;

  -- One active row per logical fact, enforced at the DB level.
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS enterprise_context_facts_one_active_per_fact_key
             ON public.enterprise_context_facts (tenant_key, record_id, fact_key)
             WHERE lifecycle_state = ''active''';

  EXECUTE 'CREATE INDEX IF NOT EXISTS enterprise_context_facts_load_batch_idx
             ON public.enterprise_context_facts (tenant_key, load_batch_id)';

  EXECUTE 'COMMENT ON INDEX enterprise_context_facts_one_active_per_fact_key IS
    ''WS-B: exactly one active row per logical fact; changed values must supersede the prior active row (no duplicate current facts).''';
END
$ws_b_facts$;

DO $ws_b_chunks$
BEGIN
  IF to_regclass('public.enterprise_context_chunks') IS NULL THEN
    RAISE NOTICE 'ws-b: enterprise_context_chunks absent; skipping chunk load lineage.';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.enterprise_context_chunks ADD COLUMN IF NOT EXISTS load_batch_id TEXT';
  EXECUTE 'CREATE INDEX IF NOT EXISTS enterprise_context_chunks_load_batch_idx
             ON public.enterprise_context_chunks (tenant_key, load_batch_id)';
END
$ws_b_chunks$;

NOTIFY pgrst, 'reload schema';

COMMIT;
