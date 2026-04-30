-- CB-2 · enterprise_context_chunks embedding columns
--
-- Adds the columns the OpenAI embedding job (`src/scripts/embed-pending-chunks.ts`)
-- writes back to. Postgres holds the embedding as a backup / audit trail; the
-- canonical retrieval path in CB-3 lives in Pinecone (single shared index, see
-- `docs/build/CONTEXT_BROKER_DESIGN.md` §3).
--
-- Why `jsonb` and not `vector(1536)`:
--   pgvector is NOT enabled in this Supabase project (no prior migration runs
--   `CREATE EXTENSION vector` and no table currently references the `vector`
--   type). Adding the extension here would couple the embedding rollout to a
--   one-way platform change. CB-3 uses Pinecone for similarity search, so the
--   Postgres column only needs to be readable for re-embed audits and ops
--   spot-checks — `jsonb` storing a `number[]` is sufficient.
--   If pgvector is later enabled, this column can be migrated to `vector(1536)`
--   in-place via `ALTER TABLE ... ALTER COLUMN embedding TYPE vector(1536) USING ...`.
--
-- Existing related columns on this table (kept untouched):
--   - `embedding_status` TEXT (CHECK in 'pending' | 'skipped' | 'embedded' | 'failed')
--   - `embedding_model`  TEXT
--   - `embedded_at`      TIMESTAMPTZ
-- The job writes to `embedded_at` for the timestamp (existing column) and
-- `embedding_model` for the model name. This migration adds:
--   - `embedding`       JSONB  — vector payload (number[])
--   - `embedding_dim`   INT    — dimension count (1536 for text-embedding-3-small)
--   - `embedding_error` TEXT   — last error message when status='failed'
--
-- RLS: `enterprise_context_chunks` already has service-role-all policies
-- enabled (see migration 20260430121500). New columns inherit the existing
-- table policies; nothing to change here.

ALTER TABLE enterprise_context_chunks
  ADD COLUMN IF NOT EXISTS embedding JSONB;

ALTER TABLE enterprise_context_chunks
  ADD COLUMN IF NOT EXISTS embedding_dim INTEGER;

ALTER TABLE enterprise_context_chunks
  ADD COLUMN IF NOT EXISTS embedding_error TEXT;

COMMENT ON COLUMN enterprise_context_chunks.embedding IS
  'OpenAI embedding vector (number[]) stored as jsonb. Pinecone is the canonical retrieval store; this column is the Postgres backup / audit trail. CB-3.';

COMMENT ON COLUMN enterprise_context_chunks.embedding_dim IS
  'Dimension count of the embedding vector (e.g. 1536 for text-embedding-3-small).';

COMMENT ON COLUMN enterprise_context_chunks.embedding_error IS
  'Last error message recorded when embedding_status was set to ''failed''.';
