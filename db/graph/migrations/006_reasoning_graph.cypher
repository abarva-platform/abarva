// Migration 006 · Reasoning graph — 14-node schema for Pack C
// Additive only. Pairs with migration 005_industry_knowledge.cypher:
// 005 establishes Regulation/Framework/Benchmark/Vendor/VendorPosture/
// EnforcementAction/KnowledgeSource by r.id (UUID). 006 adds human-readable
// code/key constraints used by Pack C MERGE paths + new node types
// (Industry, RegulationSection, FrameworkControl, Product, Topic,
// Technology, UseCase). Co-existent uniqueness constraints are fine —
// each creates its own backing index.

// --- Uniqueness constraints (Pack C node vocabulary) ----------------------
CREATE CONSTRAINT industry_code IF NOT EXISTS
  FOR (i:Industry) REQUIRE i.code IS UNIQUE;

CREATE CONSTRAINT regulation_code IF NOT EXISTS
  FOR (r:Regulation) REQUIRE r.code IS UNIQUE;

CREATE CONSTRAINT regsection_id IF NOT EXISTS
  FOR (rs:RegulationSection) REQUIRE rs.id IS UNIQUE;

CREATE CONSTRAINT framework_code IF NOT EXISTS
  FOR (f:Framework) REQUIRE f.code IS UNIQUE;

CREATE CONSTRAINT fcontrol_id IF NOT EXISTS
  FOR (fc:FrameworkControl) REQUIRE fc.id IS UNIQUE;

CREATE CONSTRAINT benchmark_key IF NOT EXISTS
  FOR (b:Benchmark) REQUIRE b.key IS UNIQUE;

CREATE CONSTRAINT vendor_name IF NOT EXISTS
  FOR (v:Vendor) REQUIRE v.name IS UNIQUE;

CREATE CONSTRAINT product_id IF NOT EXISTS
  FOR (p:Product) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT topic_key IF NOT EXISTS
  FOR (t:Topic) REQUIRE t.key IS UNIQUE;

CREATE CONSTRAINT technology_key IF NOT EXISTS
  FOR (tech:Technology) REQUIRE tech.key IS UNIQUE;

CREATE CONSTRAINT usecase_id IF NOT EXISTS
  FOR (uc:UseCase) REQUIRE uc.id IS UNIQUE;

// --- Lookup indexes -------------------------------------------------------
// regulation_jurisdiction + benchmark_metric already exist in 005 —
// IF NOT EXISTS makes these no-ops if re-run.
CREATE INDEX regulation_jurisdiction IF NOT EXISTS
  FOR (r:Regulation) ON (r.jurisdiction);

CREATE INDEX benchmark_metric IF NOT EXISTS
  FOR (b:Benchmark) ON (b.metric_name);

CREATE INDEX usecase_client IF NOT EXISTS
  FOR (uc:UseCase) ON (uc.client_id);

// --- Seed core Industry nodes (idempotent) --------------------------------
MERGE (i:Industry {code: 'HEALTHCARE_IDN'})
  ON CREATE SET i.name = 'Healthcare Integrated Delivery Network';
MERGE (i2:Industry {code: 'FINSERV'})
  ON CREATE SET i2.name = 'Financial Services';
MERGE (i3:Industry {code: 'RETAIL'})
  ON CREATE SET i3.name = 'Retail';
MERGE (i4:Industry {code: 'GENERAL'})
  ON CREATE SET i4.name = 'Cross-industry';

// --- Seed core Topic nodes ------------------------------------------------
MERGE (t1:Topic {key: 'ai_governance'})
  ON CREATE SET t1.name = 'AI Governance';
MERGE (t2:Topic {key: 'phi_handling'})
  ON CREATE SET t2.name = 'PHI Handling';
MERGE (t3:Topic {key: 'privacy'})
  ON CREATE SET t3.name = 'Privacy & Data Protection';
MERGE (t4:Topic {key: 'vendor_management'})
  ON CREATE SET t4.name = 'Vendor Management';
MERGE (t5:Topic {key: 'monitoring'})
  ON CREATE SET t5.name = 'Continuous Monitoring';
MERGE (t6:Topic {key: 'roi_attribution'})
  ON CREATE SET t6.name = 'ROI Attribution';
MERGE (t7:Topic {key: 'cost_management'})
  ON CREATE SET t7.name = 'Cost Management';
MERGE (t8:Topic {key: 'risk_management'})
  ON CREATE SET t8.name = 'Risk Management';
MERGE (t9:Topic {key: 'security'})
  ON CREATE SET t9.name = 'Cybersecurity';

// --- Relationship vocabulary (documentation-only) -------------------------
// (:Regulation)-[:APPLIES_TO]->(:Industry)
// (:Regulation)-[:HAS_SECTION]->(:RegulationSection)
// (:Regulation)-[:GOVERNS]->(:Topic)
// (:Framework)-[:HAS_CONTROL]->(:FrameworkControl)
// (:FrameworkControl)-[:ADDRESSES]->(:Topic)
// (:Benchmark)-[:MEASURES_IN]->(:Industry)
// (:Vendor)-[:OFFERS]->(:Product)
// (:Vendor)-[:HAS_POSTURE]->(:VendorPosture)
// (:Vendor)-[:COMPLIES_WITH]->(:Framework)
// (:Product)-[:USES]->(:Technology)
// (:UseCase)-[:USES_PRODUCT]->(:Product)
// (:UseCase)-[:SUBJECT_TO]->(:Regulation)
// (:UseCase)-[:TRIGGERS]->(:GenomePattern)
// (:UseCase)-[:BENCHMARKED_AGAINST]->(:Benchmark)
// (:GenomePattern)-[:VIOLATES]->(:FrameworkControl)
// (:GenomePattern)-[:RELATES_TO]->(:Regulation)
// (:Engagement)-[:SURFACED]->(:GenomePattern)
// (:Engagement)-[:ADDRESSES]->(:UseCase)
// (:Client)-[:IN_INDUSTRY]->(:Industry)
// (:Client)-[:HAS_USE_CASE]->(:UseCase)
