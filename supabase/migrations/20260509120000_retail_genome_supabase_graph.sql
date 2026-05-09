-- Retail Genome Supabase graph substrate
-- Keeps Intelligence pattern retrieval on Postgres/Supabase instead of Neo4j.

BEGIN;

ALTER TABLE genome_patterns
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS failure_rate_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS office_category TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE knowledge_sources
  ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_genome_patterns_code_unique
  ON genome_patterns(code);

CREATE INDEX IF NOT EXISTS idx_genome_patterns_office_category
  ON genome_patterns(vertical, office_category)
  WHERE office_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_genome_patterns_keywords
  ON genome_patterns USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_summary_present
  ON knowledge_sources(status, content_type)
  WHERE summary IS NOT NULL;

CREATE TABLE IF NOT EXISTS intelligence_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_type TEXT NOT NULL,
  from_node_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  to_node_type TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  vertical TEXT,
  weight NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT intelligence_graph_edges_weight_check CHECK (weight >= 0 AND weight <= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_graph_edges_unique
  ON intelligence_graph_edges(from_node_type, from_node_id, edge_type, to_node_type, to_node_id);

CREATE INDEX IF NOT EXISTS idx_intelligence_graph_edges_from
  ON intelligence_graph_edges(vertical, from_node_type, from_node_id, edge_type);

CREATE INDEX IF NOT EXISTS idx_intelligence_graph_edges_to
  ON intelligence_graph_edges(vertical, to_node_type, to_node_id, edge_type);

DROP TRIGGER IF EXISTS intelligence_graph_edges_set_updated_at ON intelligence_graph_edges;
CREATE TRIGGER intelligence_graph_edges_set_updated_at BEFORE UPDATE ON intelligence_graph_edges
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE intelligence_graph_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_intelligence_graph_edges" ON intelligence_graph_edges;
CREATE POLICY "service_role_all_intelligence_graph_edges" ON intelligence_graph_edges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_intelligence_graph_edges" ON intelligence_graph_edges;
CREATE POLICY "authenticated_read_intelligence_graph_edges" ON intelligence_graph_edges
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE VIEW intelligence_pattern_source_graph AS
SELECT
  e.id AS edge_id,
  e.edge_type,
  e.vertical,
  e.weight,
  e.evidence,
  p.id AS pattern_id,
  p.code AS pattern_code,
  p.name AS pattern_name,
  p.office_category,
  p.failure_rate_pct,
  ks.id AS source_id,
  ks.source_key,
  ks.title AS source_title,
  ks.publisher,
  ks.content_type,
  ks.summary AS source_summary
FROM intelligence_graph_edges e
JOIN genome_patterns p
  ON e.from_node_type = 'genome_pattern'
  AND e.from_node_id = p.code
LEFT JOIN knowledge_sources ks
  ON e.to_node_type = 'knowledge_source'
  AND e.to_node_id = ks.source_key;

NOTIFY pgrst, 'reload schema';

COMMIT;
