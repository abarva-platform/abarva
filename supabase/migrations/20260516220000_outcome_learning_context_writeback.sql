-- OUTCOME → CONTEXT WRITE-BACK · Wave 3, Slice 3.7
-- The final arrow of the decision loop. The Slice 3.1 outcome ledger
-- records realized AI value and the Slice 3.6 outcome-pattern-feedback
-- table captures the anonymizable cross-tenant signal — but neither
-- writes the learning back into the *tenant's own* Context layer. So a
-- future Intelligence query for that tenant could not be grounded in
-- "this bet was made, and here is what actually happened", and the
-- story-pack generator could never set `loopClosed: true`.
--
-- Design notes:
--
-- 1. NO NEW TABLE. The tenant Context layer already exists:
--    `enterprise_context_records` (20260514100000_enterprise_context_layer.sql)
--    is a generic, tenant-scoped record store with a free `record_type`
--    discriminator, a `payload JSONB` body, a `lifecycle_state`, and an
--    `evidence_pointer`. Outcome learning is simply a Context record of
--    `record_type = 'outcome_learning'`. Reusing the table keeps this
--    slice additive and means the write inherits the table's existing
--    RLS, indexes, and chunk-queue plumbing for free.
--
-- 2. WHY NOT THE 3.6 FEEDBACK TABLE. `outcome_pattern_feedback` is the
--    cross-tenant, privacy-first path — it DROPS labels so a later
--    aggregation job can anonymize by column-drop. The Context
--    write-back is the opposite: it is tenant-FACING and deliberately
--    KEEPS the subject label and realized figures so the tenant's own
--    Intelligence retrieval can cite a concrete prior outcome. Two
--    siblings, not substitutes — hence the Context layer, not 3.6.
--
-- 3. RLS — already enforced. `enterprise_context_records` has RLS
--    ENABLEd with the canonical `can_read_tenant_by_key` /
--    `can_write_tenant_by_key` helpers (see the enterprise-context-layer
--    migration). The `outcome_learning` rows this slice writes are
--    therefore tenant-scoped from the start with no new policy needed.
--    This migration only adds a lookup index and a documentation
--    comment; it adds NO column and NO table, so no new RLS surface.
--
-- 4. IDEMPOTENT WRITE-BACK. The application keys each row's
--    `canonical_record_id` deterministically off the source ledger
--    entry id (`outcome-learning-<entryId>`). The table's existing
--    `UNIQUE (tenant_key, canonical_record_id)` constraint makes the
--    write an idempotent upsert: re-closing the loop for the same
--    outcome overwrites the same Context record, never duplicates it.
--
-- 5. Additive only — extends the Context substrate without touching
--    `enterprise_context_records`' schema, `outcome_ledger`, or
--    `outcome_pattern_feedback`.
--
-- The founder applies this via `npm run db:migrate`; it is authored,
-- NOT applied, in this slice.

BEGIN;

-- Fast retrieval of a tenant's realized-outcome learning. A grounded
-- Intelligence query filters the Context layer on
-- `record_type = 'outcome_learning'` for one tenant and reads the most
-- recent learning first — this partial index serves exactly that path.
CREATE INDEX IF NOT EXISTS idx_enterprise_context_records_outcome_learning
  ON enterprise_context_records (tenant_key, updated_at DESC)
  WHERE record_type = 'outcome_learning' AND lifecycle_state = 'active';

COMMENT ON INDEX idx_enterprise_context_records_outcome_learning IS
  'Tower→Outcome→Context loop closure (Slice 3.7): serves grounded Intelligence retrieval of a tenant''s realized AI-value outcomes. Rows are enterprise_context_records of record_type=''outcome_learning'', written by src/lib/tower/outcome-context-writeback/ from verified/realized outcome_ledger entries. canonical_record_id = ''outcome-learning-<entryId>'' makes the write an idempotent upsert on the table''s UNIQUE (tenant_key, canonical_record_id) constraint.';

NOTIFY pgrst, 'reload schema';

COMMIT;
