// Migration 010 · Retail vertical graph — Pack I Phase 4
// Depends on 007_cross_industry.cypher.
// Additive: adds 5 retail-specific node constraints.

// --- Node uniqueness constraints ------------------------------------------
CREATE CONSTRAINT product_id IF NOT EXISTS
  FOR (p:Product) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT supply_chain_id IF NOT EXISTS
  FOR (s:SupplyChain) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT store_id IF NOT EXISTS
  FOR (s:Store) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT strategy_id IF NOT EXISTS
  FOR (s:Strategy) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT order_id IF NOT EXISTS
  FOR (o:Order) REQUIRE o.id IS UNIQUE;

// --- Relationship vocabulary documented inline ---------------------------
// (:Product)   -[:MOVES_THROUGH]-> (:SupplyChain)
// (:Store)     -[:SELLS]->         (:Product)
// (:User)      -[:BUYS]->          (:Product)
// (:Product)   -[:PRICED_BY]->     (:Strategy)
// (:Order)     -[:CONTAINS]->      (:Product)
// (:Order)     -[:RETURNED]->      (:Product)
// (:Store)     -[:IN_REGION]->     (:Region)
// (:UseCase)   -[:OPTIMIZES]->     (:SupplyChain)
