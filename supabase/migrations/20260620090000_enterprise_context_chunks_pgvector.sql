-- W2.2 · Native pgvector retrieval for tenant-private context chunks.
--
-- Keep the existing JSONB `embedding` column as rollback/audit material,
-- and add the native vector column used by Postgres semantic retrieval.

DO $$
DECLARE
  target_schema text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_available_extensions
     WHERE name = 'vector'
  ) THEN
    RAISE NOTICE 'pgvector extension is not installed on this Postgres image; skipping embedding_vector migration in this replay environment.';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS vector;

  FOR target_schema IN
    SELECT table_schema
      FROM information_schema.tables
     WHERE table_name = 'enterprise_context_chunks'
       AND table_type = 'BASE TABLE'
       AND table_schema NOT IN ('information_schema', 'pg_catalog')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.enterprise_context_chunks ADD COLUMN IF NOT EXISTS embedding_vector vector(1536)',
      target_schema
    );

    EXECUTE format(
      'COMMENT ON COLUMN %I.enterprise_context_chunks.embedding_vector IS %L',
      target_schema,
      'Native pgvector embedding for tenant-private semantic retrieval. JSONB embedding remains for rollback/audit.'
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_embedding_vector_hnsw
         ON %I.enterprise_context_chunks
      USING hnsw (embedding_vector vector_cosine_ops)
      WHERE embedding_vector IS NOT NULL',
      target_schema
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_enterprise_context_chunks_tenant_embedding_vector
         ON %I.enterprise_context_chunks (tenant_key)
      WHERE embedding_vector IS NOT NULL',
      target_schema
    );
  END LOOP;
END $$;
