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
-- The loader (admin-structured-context-promotion.ts) supersedes the prior active
-- fact before upserting the new value, so changed values update the logical fact
-- instead of duplicating it. Live replay is validated on Azure Container Apps.

BEGIN;

ALTER TABLE enterprise_context_facts ADD COLUMN IF NOT EXISTS load_batch_id TEXT;
ALTER TABLE enterprise_context_chunks ADD COLUMN IF NOT EXISTS load_batch_id TEXT;

-- Collapse pre-existing duplicate active facts: keep the most recently updated
-- row per (tenant_key, record_id, fact_key); supersede the older duplicates.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY tenant_key, record_id, fact_key
           ORDER BY updated_at DESC, created_at DESC, id DESC
         ) AS rn
  FROM enterprise_context_facts
  WHERE lifecycle_state = 'active'
)
UPDATE enterprise_context_facts AS f
SET lifecycle_state = 'superseded',
    updated_at = now()
FROM ranked
WHERE f.id = ranked.id
  AND ranked.rn > 1;

-- One active row per logical fact, enforced at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS enterprise_context_facts_one_active_per_fact_key
  ON enterprise_context_facts (tenant_key, record_id, fact_key)
  WHERE lifecycle_state = 'active';

CREATE INDEX IF NOT EXISTS enterprise_context_facts_load_batch_idx
  ON enterprise_context_facts (tenant_key, load_batch_id);

CREATE INDEX IF NOT EXISTS enterprise_context_chunks_load_batch_idx
  ON enterprise_context_chunks (tenant_key, load_batch_id);

COMMENT ON INDEX enterprise_context_facts_one_active_per_fact_key IS
  'WS-B: exactly one active row per logical fact; changed values must supersede the prior active row (no duplicate current facts).';

NOTIFY pgrst, 'reload schema';

COMMIT;
