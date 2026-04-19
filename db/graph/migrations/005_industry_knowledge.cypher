// Migration 005 · Industry knowledge layer — graph-queryable entities
// Pairs with supabase/migrations/024_knowledge_sources.sql.
// Regulations, frameworks, benchmarks, vendor postures that Claude can
// traverse during engagement turns to cite authority + peer anchors.

// --- Node uniqueness ------------------------------------------------------
CREATE CONSTRAINT regulation_id IF NOT EXISTS
  FOR (r:Regulation) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT framework_id IF NOT EXISTS
  FOR (f:Framework) REQUIRE f.id IS UNIQUE;

CREATE CONSTRAINT benchmark_id IF NOT EXISTS
  FOR (b:Benchmark) REQUIRE b.id IS UNIQUE;

CREATE CONSTRAINT vendor_id IF NOT EXISTS
  FOR (v:Vendor) REQUIRE v.id IS UNIQUE;

CREATE CONSTRAINT vendor_posture_id IF NOT EXISTS
  FOR (vp:VendorPosture) REQUIRE vp.id IS UNIQUE;

CREATE CONSTRAINT enforcement_action_id IF NOT EXISTS
  FOR (ea:EnforcementAction) REQUIRE ea.id IS UNIQUE;

CREATE CONSTRAINT knowledge_source_id IF NOT EXISTS
  FOR (ks:KnowledgeSource) REQUIRE ks.id IS UNIQUE;

// --- Lookup indexes -------------------------------------------------------
CREATE INDEX regulation_industry IF NOT EXISTS
  FOR (r:Regulation) ON (r.industry_code);

CREATE INDEX regulation_jurisdiction IF NOT EXISTS
  FOR (r:Regulation) ON (r.jurisdiction);

CREATE INDEX framework_topic IF NOT EXISTS
  FOR (f:Framework) ON (f.topic_code);

CREATE INDEX benchmark_metric IF NOT EXISTS
  FOR (b:Benchmark) ON (b.metric_name);

CREATE INDEX benchmark_industry IF NOT EXISTS
  FOR (b:Benchmark) ON (b.industry_code);

CREATE INDEX vendor_category IF NOT EXISTS
  FOR (v:Vendor) ON (v.category);

CREATE INDEX knowledge_source_content_type IF NOT EXISTS
  FOR (ks:KnowledgeSource) ON (ks.content_type);

// --- Relationship vocabulary (documentation-only; Neo4j creates on write)
// (:Regulation)-[:APPLIES_TO]->(:Industry)
// (:Regulation)-[:ENFORCED_BY]->(:Authority)
// (:EnforcementAction)-[:AGAINST]->(:Vendor|:Organization)
// (:EnforcementAction)-[:CITES]->(:Regulation)
// (:Benchmark)-[:MEASURES]->(:Topic)
// (:Benchmark)-[:SOURCED_FROM]->(:KnowledgeSource)
// (:Framework)-[:GUIDES]->(:Topic)
// (:Framework)-[:PUBLISHED_BY]->(:Publisher)
// (:Vendor)-[:OFFERS]->(:Solution)
// (:VendorPosture)-[:DESCRIBES]->(:Vendor)
// (:VendorPosture)-[:SOURCED_FROM]->(:KnowledgeSource)
// (:KnowledgeSource)-[:ABOUT]->(:Industry|:Topic)
