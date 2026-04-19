-- Migration 024 · Industry knowledge layer — sources + chunks tracking
-- Idempotent. Pairs with db/graph/migrations/005_industry_knowledge.cypher
-- for graph-queryable regulation/framework/benchmark/vendor entities.

BEGIN;

DO $$ BEGIN
  CREATE TYPE knowledge_license_class AS ENUM (
    'public_domain',
    'attribution',
    'registration',
    'fair_use_excerpt',
    'licensed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE knowledge_content_type AS ENUM (
    'regulation',
    'framework',
    'benchmark',
    'research_report',
    'vendor_doc',
    'vendor_posture',
    'news_article',
    'case_study',
    'enforcement_action'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  publisher_url TEXT,
  source_url TEXT NOT NULL,
  content_type knowledge_content_type NOT NULL,
  license_class knowledge_license_class NOT NULL,
  license_notes TEXT,
  industry_tags TEXT[] NOT NULL DEFAULT '{}',
  topic_tags TEXT[] NOT NULL DEFAULT '{}',
  published_at DATE,
  half_life_days INT NOT NULL DEFAULT 365,
  chunk_count INT NOT NULL DEFAULT 0,
  pinecone_namespace TEXT NOT NULL,
  last_ingested_at TIMESTAMPTZ,
  last_refresh_check_at TIMESTAMPTZ,
  content_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','ingesting','active','stale','failed','licensed_hold'
  )),
  ingestion_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_industry ON knowledge_sources USING GIN(industry_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_topics ON knowledge_sources USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON knowledge_sources(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_namespace ON knowledge_sources(pinecone_namespace);

DROP TRIGGER IF EXISTS knowledge_sources_set_updated_at ON knowledge_sources;
CREATE TRIGGER knowledge_sources_set_updated_at BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  pinecone_id TEXT NOT NULL UNIQUE,
  chunk_text TEXT NOT NULL,
  section TEXT,
  page_number INT,
  token_count INT,
  chunk_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);

ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_knowledge_sources" ON knowledge_sources;
CREATE POLICY "service_role_all_knowledge_sources" ON knowledge_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "service_role_all_knowledge_chunks" ON knowledge_chunks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
