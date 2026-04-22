// Migration 007 · Cross-industry core graph — Pack I Phase 1
// Depends on 006_reasoning_graph.cypher (Industry + Topic nodes).
// Additive: adds 10 new node constraints + seeds 4 CloudProvider nodes.

// --- Node uniqueness constraints ------------------------------------------
CREATE CONSTRAINT infra_stack_id IF NOT EXISTS
  FOR (i:InfraStack) REQUIRE i.id IS UNIQUE;

CREATE CONSTRAINT cloud_provider_name IF NOT EXISTS
  FOR (c:CloudProvider) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT region_key IF NOT EXISTS
  FOR (r:Region) REQUIRE r.key IS UNIQUE;

CREATE CONSTRAINT system_id IF NOT EXISTS
  FOR (s:System) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT integration_id IF NOT EXISTS
  FOR (i:Integration) REQUIRE i.id IS UNIQUE;

CREATE CONSTRAINT data_source_id IF NOT EXISTS
  FOR (d:DataSource) REQUIRE d.id IS UNIQUE;

CREATE CONSTRAINT pipeline_id IF NOT EXISTS
  FOR (p:Pipeline) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT policy_id IF NOT EXISTS
  FOR (p:Policy) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT cost_center_id IF NOT EXISTS
  FOR (cc:CostCenter) REQUIRE cc.id IS UNIQUE;

CREATE CONSTRAINT team_id IF NOT EXISTS
  FOR (t:Team) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT model_id IF NOT EXISTS
  FOR (m:Model) REQUIRE m.id IS UNIQUE;

// --- Seed canonical cloud providers (idempotent) -------------------------
MERGE (cp1:CloudProvider {name: 'AWS'})
  ON CREATE SET cp1.category = 'hyperscaler', cp1.parent_org = 'Amazon';
MERGE (cp2:CloudProvider {name: 'Azure'})
  ON CREATE SET cp2.category = 'hyperscaler', cp2.parent_org = 'Microsoft';
MERGE (cp3:CloudProvider {name: 'Google Cloud'})
  ON CREATE SET cp3.category = 'hyperscaler', cp3.parent_org = 'Google';
MERGE (cp4:CloudProvider {name: 'on_prem'})
  ON CREATE SET cp4.category = 'on_premise', cp4.parent_org = null;

// --- Relationship vocabulary documented inline ---------------------------
// (:Client)   -[:HAS]->          (:InfraStack) -[:RUNS_ON]-> (:CloudProvider)
// (:InfraStack) -[:IN_REGION]->  (:Region)
// (:UseCase)  -[:USES]->         (:System)     -[:INTEGRATES_WITH]-> (:System)
// (:System)   -[:GENERATES]->    (:DataSource) -[:GOVERNED_BY]-> (:Policy)
// (:DataSource) -[:FEEDS]->      (:Pipeline)
// (:Client)   -[:SPENDS]->       (:CostCenter) -[:FUNDS]-> (:System)
// (:Team)     -[:BUILDS]->       (:System)
// (:UseCase)  -[:RUNS_ON]->      (:Model)
