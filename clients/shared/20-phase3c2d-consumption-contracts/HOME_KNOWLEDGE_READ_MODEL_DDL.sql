-- Phase 3C-2D Consumption Contracts, Read Models and Semantic-Layer Certification
-- Status: contract DDL artifact only. This file is NOT a migration and is not applied by CI.
-- Purpose: define the stable consumption layer every tenant load wave must build and reconcile.

BEGIN;

CREATE SCHEMA IF NOT EXISTS consumption;

CREATE TABLE IF NOT EXISTS consumption.projection_registry (
  projection_name TEXT PRIMARY KEY,
  projection_contract_version TEXT NOT NULL,
  consumer_modules TEXT[] NOT NULL,
  source_publication TEXT NOT NULL,
  required_for_baseline BOOLEAN NOT NULL DEFAULT true,
  partial_data_behavior TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'knowledge-platform',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consumption.baseline_activation (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('candidate', 'active', 'inactive', 'failed', 'rolled_back')),
  activated_at TIMESTAMPTZ,
  previous_baseline_ref TEXT,
  activation_content_hash TEXT NOT NULL,
  validation_report_uri TEXT,
  PRIMARY KEY (tenant_key, knowledge_baseline_ref)
);

CREATE TABLE IF NOT EXISTS consumption.refresh_run (
  refresh_run_id TEXT PRIMARY KEY,
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  domain_publication_ref TEXT,
  projection_name TEXT NOT NULL REFERENCES consumption.projection_registry(projection_name),
  status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'pass', 'fail', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_hash TEXT,
  output_hash TEXT,
  failure_code TEXT,
  failure_detail TEXT
);

CREATE TABLE IF NOT EXISTS consumption.consumer_reconciliation_ledger (
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  measure_or_view TEXT NOT NULL,
  canonical_value TEXT,
  publication_value TEXT,
  consumption_value TEXT,
  cube_value TEXT,
  api_value TEXT,
  ui_value TEXT,
  key_set_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'not_applicable', 'not_measured')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- View contracts below are intentionally conservative. Final implementations may
-- replace the body, but may not remove required metadata columns.
CREATE OR REPLACE VIEW consumption.enterprise_brief_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.enterprise_identity_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.executive_perspective_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.strategic_interpretation_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.domain_summary_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.application_inventory_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.vendor_contract_inventory_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.metric_observation_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS metric_id,
  NULL::date AS period_start,
  NULL::date AS period_end,
  NULL::numeric AS metric_value,
  NULL::text AS unit
WHERE false;

CREATE OR REPLACE VIEW consumption.relationship_node_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS node_id,
  NULL::text AS node_type,
  NULL::text AS label
WHERE false;

CREATE OR REPLACE VIEW consumption.relationship_edge_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS edge_id,
  NULL::text AS from_node_id,
  NULL::text AS to_node_id,
  NULL::text AS relationship_type
WHERE false;

CREATE OR REPLACE VIEW consumption.relationship_evidence_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.evidence_gap_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.search_document_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

CREATE OR REPLACE VIEW consumption.module_knowledge_packet_v1 AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  'phase3c2d-consumption-contracts-v1.0.0'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash,
  NULL::text AS object_id,
  NULL::text AS display_name,
  NULL::jsonb AS payload
WHERE false;

COMMIT;
