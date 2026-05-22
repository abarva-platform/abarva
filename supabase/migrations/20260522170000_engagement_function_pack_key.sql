-- ENGAGEMENT FUNCTION PACK KEY · promote functionPackKey to a first-class column
--
-- PR #2241 gave a Move (`engagements` row) a "function identity" — the Domain
-- Function Pack key the Move resolves to. To avoid a schema migration while an
-- Azure migration was in flight, that PR stored the key inside the existing
-- `engagements.charter` JSONB as `charter.functionPackKey` (and the classifier
-- confidence as `charter.functionPackConfidence`).
--
-- The Azure migration is now complete and schema migrations are unblocked, so
-- this promotes the key to a proper first-class column — queryable, indexable,
-- and no longer hidden inside an untyped JSONB blob.
--
-- Design notes:
--
-- 1. Additive and NON-BREAKING. The new columns are NULLABLE; no existing
--    column or contract is touched. `charter.functionPackKey` is deliberately
--    KEPT — retiring it is a separate future cleanup. Until then the read path
--    dual-sources (column first, charter fallback) and origination dual-writes
--    (column + charter), so a rollback to the pre-migration code is harmless.
--
-- 2. The backfill copies the JSONB value into the column for every row that
--    already carries it. `charter->>'functionPackKey'` yields the text value
--    (or NULL when the key is absent); the WHERE guard keeps the UPDATE to
--    rows that actually have the key. `functionPackConfidence` is a JSON
--    number — cast via the `->` accessor so a malformed value backfills NULL
--    rather than aborting the migration.
--
-- 3. A non-unique index on `function_pack_key` — many Moves share a pack key,
--    so portfolio / analytics queries that filter or group by pack key get an
--    index-backed path. Partial (WHERE NOT NULL) since the column is sparse.
--
-- 4. Mirrors the additive ALTER pattern of 007_engagement_enhancements.sql.
--
-- The founder applies this via `npm run db:migrate`; it is authored, NOT
-- applied, in this slice. It MUST be applied before the new origination code
-- is deployed — origination inserts the `function_pack_key` column.

BEGIN;

-- The first-class function-identity columns. NULLABLE — a Move whose brief
-- did not classify to a pack carries NULL, the honest "no function identity".
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS function_pack_key        TEXT,
  ADD COLUMN IF NOT EXISTS function_pack_confidence NUMERIC;

COMMENT ON COLUMN engagements.function_pack_key IS
  'The Domain Function Pack function key the Move resolves to (e.g. ''customer_care''). Classified at origination from the brief text + industry code. NULL when no pack cleared the confidence floor. Promoted from charter.functionPackKey (PR #2241); charter still dual-written for rollback safety. Read via resolveMoveFunctionIdentity.';

COMMENT ON COLUMN engagements.function_pack_confidence IS
  'The 0-1 deterministic confidence score of the function_pack_key classification. NULL when function_pack_key is NULL. Promoted from charter.functionPackConfidence.';

-- Backfill from the JSONB the origination path has been writing since PR #2241.
-- Only rows that carry the key are touched; everything else keeps NULL.
UPDATE engagements
   SET function_pack_key = charter->>'functionPackKey'
 WHERE charter ? 'functionPackKey'
   AND charter->>'functionPackKey' IS NOT NULL
   AND function_pack_key IS NULL;

-- The confidence is a JSON number — pull it through the `->` accessor and cast.
-- A non-numeric value yields NULL rather than aborting the migration.
UPDATE engagements
   SET function_pack_confidence =
         CASE
           WHEN jsonb_typeof(charter->'functionPackConfidence') = 'number'
             THEN (charter->>'functionPackConfidence')::NUMERIC
           ELSE NULL
         END
 WHERE charter ? 'functionPackConfidence'
   AND function_pack_confidence IS NULL;

-- A non-unique, partial index — portfolio / analytics queries that filter or
-- group by pack key get an index-backed path. Partial since the column is
-- sparse (only classified Moves carry a value).
CREATE INDEX IF NOT EXISTS idx_engagements_function_pack_key
  ON engagements (function_pack_key)
  WHERE function_pack_key IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
