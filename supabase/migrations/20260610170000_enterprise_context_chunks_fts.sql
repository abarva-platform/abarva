-- Azure-native Postgres full-text index on enterprise_context_chunks.
-- Makes governed_object_readiness.retrievability = 'fts_indexed' legitimate for
-- committed context chunks (the live Source/agent retrieval ranks with
-- to_tsvector/websearch_to_tsquery over chunk_text). Additive, idempotent.
CREATE INDEX IF NOT EXISTS idx_ecc_fts
  ON public.enterprise_context_chunks
  USING gin (to_tsvector('english', coalesce(chunk_text, '')));
