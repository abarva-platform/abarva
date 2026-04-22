-- Migration 050 · Demo client seed and engagement client backfill
-- Extracted from 020 so schema DDL and demo DML run independently.

BEGIN;

-- clients has a CREATE UNIQUE INDEX on name (from 020), but the
-- ON CONFLICT planner rejects it — can happen when the index was
-- created via CREATE UNIQUE INDEX rather than ALTER TABLE ADD
-- CONSTRAINT UNIQUE. Use WHERE NOT EXISTS for re-run safety regardless.
INSERT INTO clients (name, legal_name, industry_code)
SELECT 'Meridian Health', 'Meridian Health System, Inc.', 'HEALTHCARE_IDN'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Meridian Health');

INSERT INTO clients (name, legal_name, industry_code)
SELECT 'First Capital', 'First Capital Financial Corporation', 'FINSERV'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'First Capital');

INSERT INTO clients (name, legal_name, industry_code)
SELECT 'Apex Retail', 'Apex Retail Group LLC', 'RETAIL'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Apex Retail');

UPDATE engagements
SET client_id = c.id
FROM clients c
WHERE c.name = 'Meridian Health'
  AND engagements.graph_node_id = 'eng_meridian_analytics_mod'
  AND engagements.client_id IS NULL;

UPDATE engagements
SET client_id = c.id
FROM clients c
WHERE c.name = 'First Capital'
  AND engagements.graph_node_id = 'eng_arcturus_wealth_platform'
  AND engagements.client_id IS NULL;

UPDATE engagements
SET client_id = c.id
FROM clients c
WHERE c.name = 'Apex Retail'
  AND engagements.graph_node_id = 'eng_apex_retail_hr_erp'
  AND engagements.client_id IS NULL;

COMMIT;
