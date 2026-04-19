// Migration 011 · Pack K — Helix ↔ Meridian cross-client edges in Neo4j
// Mirrors the Supabase client_partnerships table rows so Cypher traversals
// can reason across clients. Idempotent via MERGE + ON CREATE SET.

// --- Client node constraint ----------------------------------------------
CREATE CONSTRAINT client_name_unique IF NOT EXISTS
  FOR (c:Client) REQUIRE c.name IS UNIQUE;

// --- Seed Client nodes ---------------------------------------------------
MERGE (helix:Client {name: 'Helix Therapeutics'})
  ON CREATE SET
    helix.supabase_id = '4cddbcfe-c17c-41f7-91b0-52854a561218',
    helix.industry_code = 'HEALTHCARE_IDN',
    helix.vertical = 'pharma',
    helix.annual_revenue_usd = 22000000000,
    helix.employees = 18000;

MERGE (meridian:Client {name: 'Meridian Health'})
  ON CREATE SET
    meridian.supabase_id = 'a20ecef5-f0ea-4890-b9d5-7375fab223ff',
    meridian.industry_code = 'HEALTHCARE_IDN',
    meridian.vertical = 'idn',
    meridian.annual_revenue_usd = 14200000000,
    meridian.employees = 28400;

MERGE (firstcap:Client {name: 'First Capital'})
  ON CREATE SET
    firstcap.supabase_id = 'a75687bf-71b9-4524-ab4e-68ae3f28d200',
    firstcap.industry_code = 'FINSERV',
    firstcap.annual_revenue_usd = 28000000000,
    firstcap.employees = 34000;

MERGE (apex:Client {name: 'Apex Retail'})
  ON CREATE SET
    apex.supabase_id = 'bb8ed961-a049-4d0c-a38f-f8912138fceb',
    apex.industry_code = 'RETAIL',
    apex.annual_revenue_usd = 18000000000,
    apex.employees = 72000;

// --- Helix ↔ Meridian partnership edges ----------------------------------
MATCH (h:Client {name: 'Helix Therapeutics'})
MATCH (m:Client {name: 'Meridian Health'})

MERGE (h)-[r1:PARTNERS_WITH {type: 'clinical_trials'}]->(m)
  ON CREATE SET r1.active_trials = 47, r1.of_total = 340, r1.annual_usd = 3200000;

MERGE (h)-[r2:LICENSES_DATA_FROM {type: 'rwe'}]->(m)
  ON CREATE SET r2.annual_usd = 8400000, r2.scope = 'de-identified EHR-linked cohorts', r2.trials_supported = 12;

MERGE (h)-[r3:ENGAGES_SPECIALISTS_AT {type: 'msl'}]->(m)
  ON CREATE SET r3.quarterly_visits = 180;

MERGE (h)-[r4:SHARES_VENDOR {vendor: 'Tempus Next'}]->(m)
  ON CREATE SET r4.use = 'genomics data sharing';

MERGE (h)-[r5:SHARES_VENDOR {vendor: 'Flatiron'}]->(m)
  ON CREATE SET r5.use = 'oncology RWE subscription overlap';

MERGE (h)-[r6:RECRUITS_PATIENTS_FROM {type: 'patient_recruitment'}]->(m)
  ON CREATE SET r6.vendor = 'Deep 6 AI', r6.recruitment_lift_x = 4.2;

MERGE (h)-[r7:HAS_PRODUCTS_ON_FORMULARY {type: 'formulary'}]->(m)
  ON CREATE SET r7.helix_drugs = 8, r7.of_total = 14;

MERGE (h)-[r8:ROUTES_MED_INFO_THROUGH {type: 'medical_info'}]->(m)
  ON CREATE SET r8.monthly_queries = 340, r8.platform = 'Within3 + Claude';

// --- Relationship vocabulary (documentation-only) ------------------------
// (:Client) -[:PARTNERS_WITH {type}]-> (:Client)
// (:Client) -[:LICENSES_DATA_FROM]-> (:Client)
// (:Client) -[:ENGAGES_SPECIALISTS_AT]-> (:Client)
// (:Client) -[:SHARES_VENDOR {vendor}]-> (:Client)
// (:Client) -[:RECRUITS_PATIENTS_FROM]-> (:Client)
// (:Client) -[:HAS_PRODUCTS_ON_FORMULARY]-> (:Client)
// (:Client) -[:ROUTES_MED_INFO_THROUGH]-> (:Client)
