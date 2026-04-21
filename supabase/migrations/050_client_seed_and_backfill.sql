-- Migration 050 · Demo client seed and engagement client backfill
-- Extracted from 020 so schema DDL and demo DML run independently.

BEGIN;

INSERT INTO clients (name, legal_name, industry_code)
VALUES ('Meridian Health', 'Meridian Health System, Inc.', 'HEALTHCARE_IDN')
ON CONFLICT (name) DO NOTHING;

INSERT INTO clients (name, legal_name, industry_code)
VALUES ('First Capital', 'First Capital Financial Corporation', 'FINSERV')
ON CONFLICT (name) DO NOTHING;

INSERT INTO clients (name, legal_name, industry_code)
VALUES ('Apex Retail', 'Apex Retail Group LLC', 'RETAIL')
ON CONFLICT (name) DO NOTHING;

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
