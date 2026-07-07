-- Azure-native Postgres full-text index on enterprise_context_chunks.
-- Makes governed_object_readiness.retrievability = 'fts_indexed' legitimate for
-- committed context chunks (the live Source/agent retrieval ranks with
-- to_tsvector/websearch_to_tsquery over chunk_text). Additive, idempotent.
--
-- Guarded for a fresh-replay where enterprise_context_chunks may not exist at
-- this point in the migration order (a later compatibility migration can
-- restructure the context substrate). When the table + column are present the
-- index is created exactly as before; otherwise this is a safe no-op rather
-- than a hard failure that blocks the whole replay.
DO $outer$
BEGIN
  IF to_regclass('public.enterprise_context_chunks') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'enterprise_context_chunks'
         AND column_name = 'chunk_text'
     )
  THEN
    EXECUTE $idx$
      CREATE INDEX IF NOT EXISTS idx_ecc_fts
        ON public.enterprise_context_chunks
        USING gin (to_tsvector('english', coalesce(chunk_text, '')))
    $idx$;
  END IF;
END $outer$;
