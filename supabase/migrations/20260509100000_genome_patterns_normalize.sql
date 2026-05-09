-- GP-1 · Normalize genome_patterns for Supabase-native retrieval.
--
-- Context: the pattern retriever was wired to Neo4j GenomePattern nodes.
-- Neo4j is being retired in favour of Supabase Postgres as the canonical
-- graph/pattern store. The existing `genome_patterns` table has a JSONB
-- `data` blob. This migration adds normalized columns so the retriever
-- can use straightforward Postgres queries with full-text search instead
-- of Cypher.
--
-- Backwards-compatible: `data` JSONB column is kept; the new columns are
-- additive. Existing rows (if any) will have NULLs in the new columns —
-- the seed script (seed-patterns-retail.ts) will populate them.

ALTER TABLE genome_patterns
  ADD COLUMN IF NOT EXISTS code            TEXT,
  ADD COLUMN IF NOT EXISTS name            TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS failure_rate_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS office_category TEXT,   -- 'front_office' | 'middle_office' | 'back_office'
  ADD COLUMN IF NOT EXISTS tags            TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS summary         TEXT;   -- 2-3 sentence prose the retriever sends to synthesizer

-- Unique code index so upserts work cleanly.
CREATE UNIQUE INDEX IF NOT EXISTS idx_genome_patterns_code ON genome_patterns(code)
  WHERE code IS NOT NULL;

-- Full-text search index on name + description for keyword retrieval.
CREATE INDEX IF NOT EXISTS idx_genome_patterns_fts
  ON genome_patterns
  USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- knowledge_sources: add summary column so the retriever has prose to
-- send to the synthesizer rather than just title + publisher.
ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS summary TEXT;
