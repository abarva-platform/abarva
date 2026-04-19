// Migration 009 · FinServ vertical graph — Pack I Phase 3
// Depends on 007_cross_industry.cypher.
// Additive: adds 6 FinServ-specific node constraints.

// --- Node uniqueness constraints ------------------------------------------
CREATE CONSTRAINT process_id IF NOT EXISTS
  FOR (p:Process) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT risk_score_id IF NOT EXISTS
  FOR (r:RiskScore) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT transaction_id IF NOT EXISTS
  FOR (t:Transaction) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT fraud_id IF NOT EXISTS
  FOR (f:Fraud) REQUIRE f.id IS UNIQUE;

CREATE CONSTRAINT customer_id IF NOT EXISTS
  FOR (c:Customer) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT agent_id IF NOT EXISTS
  FOR (a:Agent) REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT channel_id IF NOT EXISTS
  FOR (c:Channel) REQUIRE c.id IS UNIQUE;

// --- Relationship vocabulary documented inline ---------------------------
// (:Process)     -[:GENERATES]->     (:RiskScore)
// (:Transaction) -[:FLAGGED_AS]->    (:Fraud)
// (:Transaction) -[:REVIEWED_BY]->   (:Agent)
// (:Customer)    -[:INTERACTS_WITH]-> (:Agent)
// (:Customer)    -[:USES]->          (:Channel)
// (:Channel)     -[:HOSTS]->         (:Journey)
// (:UseCase)     -[:AUTOMATES]->     (:Process)
