-- Phase 3C-2E shared Knowledge, publication and consumption framework.
-- Tenant-agnostic Azure/Postgres migration artifact. No tenant facts are inserted here.

BEGIN;

CREATE SCHEMA IF NOT EXISTS source_registry;
CREATE SCHEMA IF NOT EXISTS evidence;
CREATE SCHEMA IF NOT EXISTS working;
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE SCHEMA IF NOT EXISTS metrics;
CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS publication;
CREATE SCHEMA IF NOT EXISTS consumption;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS operations;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_authority_state') THEN
    CREATE TYPE abarva_authority_state AS ENUM (
      'candidate',
      'accepted',
      'published',
      'active',
      'retired',
      'superseded',
      'rejected',
      'restricted',
      'planning_grade'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_availability_state') THEN
    CREATE TYPE abarva_availability_state AS ENUM (
      'available',
      'not_loaded',
      'not_measured',
      'withheld',
      'conflicting',
      'stale',
      'candidate',
      'accepted',
      'superseded',
      'not_applicable'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_freshness_state') THEN
    CREATE TYPE abarva_freshness_state AS ENUM (
      'fresh',
      'stale',
      'unknown',
      'not_applicable'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_current_target_state') THEN
    CREATE TYPE abarva_current_target_state AS ENUM (
      'current',
      'target',
      'current_and_target',
      'unknown'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_review_state') THEN
    CREATE TYPE abarva_review_state AS ENUM (
      'not_reviewed',
      'accepted',
      'rejected',
      'needs_correction',
      'quarantined'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_run_state') THEN
    CREATE TYPE abarva_run_state AS ENUM (
      'planned',
      'running',
      'passed',
      'failed',
      'cancelled',
      'blocked'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS operations.run (
  tenant_key TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  release_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  run_type TEXT NOT NULL,
  run_state abarva_run_state NOT NULL DEFAULT 'planned',
  actor_ref TEXT NOT NULL,
  input_manifest_hash TEXT,
  image_digest TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_detail TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, run_ref),
  UNIQUE (tenant_key, idempotency_key),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%')
);

CREATE TABLE IF NOT EXISTS operations.checkpoint (
  tenant_key TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  checkpoint_ref TEXT NOT NULL,
  checkpoint_name TEXT NOT NULL,
  checkpoint_state abarva_run_state NOT NULL,
  expected_count BIGINT,
  actual_count BIGINT,
  content_hash TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, run_ref, checkpoint_ref),
  FOREIGN KEY (tenant_key, run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS source_registry.source (
  tenant_key TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_uri TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  source_owner_ref TEXT,
  parser_contract_ref TEXT NOT NULL,
  source_visibility TEXT NOT NULL DEFAULT 'client_visible',
  source_basis TEXT NOT NULL DEFAULT 'client_source',
  registered_run_ref TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, source_ref),
  FOREIGN KEY (tenant_key, registered_run_ref) REFERENCES operations.run (tenant_key, run_ref),
  CHECK (source_basis IN ('client_source', 'public_source', 'interview', 'system_extract', 'synthetic_demo', 'restricted_evaluator')),
  CHECK (source_visibility IN ('client_visible', 'restricted', 'evaluator_only', 'internal_ops')),
  CHECK (source_basis <> 'restricted_evaluator')
);

CREATE TABLE IF NOT EXISTS source_registry.source_version (
  tenant_key TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  landed_uri TEXT NOT NULL,
  manifest_ref TEXT NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT true,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, source_version_ref),
  UNIQUE (tenant_key, source_ref, version_number),
  FOREIGN KEY (tenant_key, source_ref) REFERENCES source_registry.source (tenant_key, source_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS evidence.evidence_item (
  tenant_key TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  citation_label TEXT NOT NULL,
  source_row_ref TEXT,
  source_object_ref TEXT,
  evidence_text TEXT,
  evidence_hash TEXT NOT NULL,
  authority_state abarva_authority_state NOT NULL DEFAULT 'candidate',
  availability_state abarva_availability_state NOT NULL DEFAULT 'candidate',
  visibility TEXT NOT NULL DEFAULT 'client_visible',
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, evidence_ref),
  FOREIGN KEY (tenant_key, source_version_ref) REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref),
  CHECK (visibility IN ('client_visible', 'restricted', 'internal_ops')),
  CHECK (authority_state <> 'restricted')
);

CREATE TABLE IF NOT EXISTS working.entity_candidate (
  tenant_key TEXT NOT NULL,
  candidate_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  candidate_payload JSONB NOT NULL,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, candidate_ref),
  FOREIGN KEY (tenant_key, source_version_ref) REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref),
  CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS working.fact_candidate (
  tenant_key TEXT NOT NULL,
  candidate_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  subject_candidate_ref TEXT,
  fact_type TEXT NOT NULL,
  fact_value JSONB NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, candidate_ref),
  FOREIGN KEY (tenant_key, source_version_ref) REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref),
  CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS working.relationship_candidate (
  tenant_key TEXT NOT NULL,
  candidate_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  from_candidate_ref TEXT NOT NULL,
  to_candidate_ref TEXT NOT NULL,
  relationship_type_ref TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  current_target_state abarva_current_target_state NOT NULL DEFAULT 'unknown',
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, candidate_ref),
  FOREIGN KEY (tenant_key, source_version_ref) REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref),
  CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE TABLE IF NOT EXISTS working.quarantine_item (
  tenant_key TEXT NOT NULL,
  quarantine_ref TEXT NOT NULL,
  source_version_ref TEXT,
  candidate_ref TEXT,
  reason_code TEXT NOT NULL,
  reason_detail TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, quarantine_ref),
  FOREIGN KEY (tenant_key, source_version_ref) REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS knowledge.entity (
  tenant_key TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  canonical_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  authority_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  availability_state abarva_availability_state NOT NULL DEFAULT 'accepted',
  freshness_state abarva_freshness_state NOT NULL DEFAULT 'unknown',
  accepted_evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  content_hash TEXT NOT NULL,
  created_run_ref TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  PRIMARY KEY (tenant_key, entity_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS knowledge.entity_alias (
  tenant_key TEXT NOT NULL,
  alias_ref TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  alias_text TEXT NOT NULL,
  alias_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  reason_code TEXT,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  PRIMARY KEY (tenant_key, alias_ref),
  FOREIGN KEY (tenant_key, entity_ref) REFERENCES knowledge.entity (tenant_key, entity_ref)
);

CREATE TABLE IF NOT EXISTS knowledge.fact_assertion (
  tenant_key TEXT NOT NULL,
  fact_ref TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  fact_value JSONB NOT NULL,
  authority_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  availability_state abarva_availability_state NOT NULL DEFAULT 'accepted',
  freshness_state abarva_freshness_state NOT NULL DEFAULT 'unknown',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  content_hash TEXT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  PRIMARY KEY (tenant_key, fact_ref),
  FOREIGN KEY (tenant_key, entity_ref) REFERENCES knowledge.entity (tenant_key, entity_ref)
);

CREATE TABLE IF NOT EXISTS knowledge.relationship_type (
  relationship_type_ref TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  from_entity_type TEXT,
  to_entity_type TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge.relationship_assertion (
  tenant_key TEXT NOT NULL,
  relationship_ref TEXT NOT NULL,
  from_entity_ref TEXT NOT NULL,
  to_entity_ref TEXT NOT NULL,
  relationship_type_ref TEXT NOT NULL,
  current_target_state abarva_current_target_state NOT NULL DEFAULT 'unknown',
  authority_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  availability_state abarva_availability_state NOT NULL DEFAULT 'accepted',
  freshness_state abarva_freshness_state NOT NULL DEFAULT 'unknown',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  relationship_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  PRIMARY KEY (tenant_key, relationship_ref),
  FOREIGN KEY (tenant_key, from_entity_ref) REFERENCES knowledge.entity (tenant_key, entity_ref),
  FOREIGN KEY (tenant_key, to_entity_ref) REFERENCES knowledge.entity (tenant_key, entity_ref),
  FOREIGN KEY (relationship_type_ref) REFERENCES knowledge.relationship_type (relationship_type_ref),
  CHECK (from_entity_ref <> to_entity_ref)
);

CREATE TABLE IF NOT EXISTS metrics.metric_definition (
  tenant_key TEXT NOT NULL,
  metric_ref TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_domain TEXT NOT NULL,
  unit TEXT NOT NULL,
  owner_ref TEXT,
  definition_text TEXT NOT NULL,
  authority_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  content_hash TEXT NOT NULL,
  PRIMARY KEY (tenant_key, metric_ref)
);

CREATE TABLE IF NOT EXISTS metrics.metric_observation (
  tenant_key TEXT NOT NULL,
  observation_ref TEXT NOT NULL,
  metric_ref TEXT NOT NULL,
  entity_ref TEXT,
  period_start DATE,
  period_end DATE,
  metric_value NUMERIC,
  disclosure_mode TEXT NOT NULL DEFAULT 'exact',
  authority_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  availability_state abarva_availability_state NOT NULL DEFAULT 'available',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  content_hash TEXT NOT NULL,
  PRIMARY KEY (tenant_key, observation_ref),
  FOREIGN KEY (tenant_key, metric_ref) REFERENCES metrics.metric_definition (tenant_key, metric_ref),
  FOREIGN KEY (tenant_key, entity_ref) REFERENCES knowledge.entity (tenant_key, entity_ref),
  CHECK (disclosure_mode IN ('exact', 'range', 'indexed', 'trend_only', 'withheld', 'not_measured'))
);

CREATE TABLE IF NOT EXISTS governance.review_decision (
  tenant_key TEXT NOT NULL,
  review_ref TEXT NOT NULL,
  reviewed_object_schema TEXT NOT NULL,
  reviewed_object_ref TEXT NOT NULL,
  review_state abarva_review_state NOT NULL,
  reviewer_ref TEXT NOT NULL,
  reason_code TEXT,
  reason_detail TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, review_ref)
);

CREATE TABLE IF NOT EXISTS governance.authority_transition (
  tenant_key TEXT NOT NULL,
  transition_ref TEXT NOT NULL,
  object_schema TEXT NOT NULL,
  object_ref TEXT NOT NULL,
  from_authority_state abarva_authority_state,
  to_authority_state abarva_authority_state NOT NULL,
  review_ref TEXT,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, transition_ref),
  FOREIGN KEY (tenant_key, review_ref) REFERENCES governance.review_decision (tenant_key, review_ref)
);

CREATE TABLE IF NOT EXISTS governance.knowledge_conflict (
  tenant_key TEXT NOT NULL,
  conflict_ref TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  object_refs TEXT[] NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, conflict_ref),
  CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CHECK (status IN ('open', 'accepted_exception', 'resolved', 'superseded'))
);

CREATE TABLE IF NOT EXISTS governance.evidence_gap (
  tenant_key TEXT NOT NULL,
  gap_ref TEXT NOT NULL,
  domain_ref TEXT NOT NULL,
  missing_evidence_type TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  owner_ref TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  availability_state abarva_availability_state NOT NULL DEFAULT 'not_loaded',
  source_request_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, gap_ref),
  CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE TABLE IF NOT EXISTS publication.domain_publication (
  tenant_key TEXT NOT NULL,
  domain_publication_ref TEXT NOT NULL,
  domain_ref TEXT NOT NULL,
  release_id TEXT NOT NULL,
  publication_state abarva_run_state NOT NULL DEFAULT 'planned',
  source_content_hash TEXT NOT NULL,
  accepted_entity_count BIGINT NOT NULL DEFAULT 0,
  accepted_fact_count BIGINT NOT NULL DEFAULT 0,
  accepted_relationship_count BIGINT NOT NULL DEFAULT 0,
  critical_gap_count BIGINT NOT NULL DEFAULT 0,
  validation_report_uri TEXT,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, domain_publication_ref),
  FOREIGN KEY (tenant_key, created_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS publication.knowledge_baseline (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  release_id TEXT NOT NULL,
  baseline_state abarva_run_state NOT NULL DEFAULT 'planned',
  is_active BOOLEAN NOT NULL DEFAULT false,
  domain_publication_refs TEXT[] NOT NULL,
  baseline_content_hash TEXT NOT NULL,
  projection_validation_hash TEXT,
  activated_run_ref TEXT,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, knowledge_baseline_ref),
  FOREIGN KEY (tenant_key, activated_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_baseline_one_active_per_tenant_idx
  ON publication.knowledge_baseline (tenant_key)
  WHERE is_active;

CREATE TABLE IF NOT EXISTS publication.publication_activation (
  tenant_key TEXT NOT NULL,
  activation_ref TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  previous_knowledge_baseline_ref TEXT,
  activation_state abarva_run_state NOT NULL DEFAULT 'planned',
  activated_run_ref TEXT,
  activated_at TIMESTAMPTZ,
  rollback_ref TEXT,
  validation_report_uri TEXT,
  PRIMARY KEY (tenant_key, activation_ref),
  FOREIGN KEY (tenant_key, knowledge_baseline_ref) REFERENCES publication.knowledge_baseline (tenant_key, knowledge_baseline_ref),
  FOREIGN KEY (tenant_key, activated_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS publication.projection_version (
  tenant_key TEXT NOT NULL,
  projection_version_ref TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  projection_name TEXT NOT NULL,
  projection_contract_version TEXT NOT NULL,
  build_state abarva_run_state NOT NULL DEFAULT 'planned',
  is_active BOOLEAN NOT NULL DEFAULT false,
  input_hash TEXT NOT NULL,
  output_hash TEXT,
  row_count BIGINT NOT NULL DEFAULT 0,
  validation_report_uri TEXT,
  built_run_ref TEXT,
  built_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_key, projection_version_ref),
  FOREIGN KEY (tenant_key, knowledge_baseline_ref) REFERENCES publication.knowledge_baseline (tenant_key, knowledge_baseline_ref),
  FOREIGN KEY (tenant_key, built_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE UNIQUE INDEX IF NOT EXISTS projection_version_one_active_idx
  ON publication.projection_version (tenant_key, knowledge_baseline_ref, projection_name)
  WHERE is_active;

CREATE TABLE IF NOT EXISTS consumption.enterprise_brief_v1 (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  domain_publication_ref TEXT NOT NULL,
  projection_contract_version TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  authority_state abarva_authority_state NOT NULL,
  freshness_state abarva_freshness_state NOT NULL,
  availability_state abarva_availability_state NOT NULL,
  evidence_coverage NUMERIC(5,4),
  content_hash TEXT NOT NULL,
  object_ref TEXT NOT NULL,
  display_name TEXT NOT NULL,
  executive_summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, knowledge_baseline_ref, object_ref)
);

CREATE TABLE IF NOT EXISTS consumption.enterprise_identity_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.executive_perspective_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.strategic_interpretation_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.domain_summary_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.application_inventory_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.technology_estate_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.data_product_inventory_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.vendor_contract_inventory_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.evidence_gap_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.search_document_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.module_knowledge_packet_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.source_event_summary_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.source_vendor_comparison_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.source_pricing_comparison_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.source_evaluation_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);
CREATE TABLE IF NOT EXISTS consumption.source_transition_risk_v1 (LIKE consumption.enterprise_brief_v1 INCLUDING ALL);

CREATE TABLE IF NOT EXISTS consumption.metric_observation_v1 (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  domain_publication_ref TEXT NOT NULL,
  projection_contract_version TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  authority_state abarva_authority_state NOT NULL,
  freshness_state abarva_freshness_state NOT NULL,
  availability_state abarva_availability_state NOT NULL,
  evidence_coverage NUMERIC(5,4),
  content_hash TEXT NOT NULL,
  observation_ref TEXT NOT NULL,
  metric_ref TEXT NOT NULL,
  entity_ref TEXT,
  period_start DATE,
  period_end DATE,
  metric_value NUMERIC,
  unit TEXT,
  disclosure_mode TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, knowledge_baseline_ref, observation_ref)
);

CREATE TABLE IF NOT EXISTS consumption.relationship_node_v1 (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  domain_publication_ref TEXT NOT NULL,
  projection_contract_version TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  authority_state abarva_authority_state NOT NULL,
  freshness_state abarva_freshness_state NOT NULL,
  availability_state abarva_availability_state NOT NULL,
  evidence_coverage NUMERIC(5,4),
  content_hash TEXT NOT NULL,
  node_ref TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  current_target_state abarva_current_target_state NOT NULL DEFAULT 'unknown',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, knowledge_baseline_ref, node_ref)
);

CREATE TABLE IF NOT EXISTS consumption.relationship_edge_v1 (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  domain_publication_ref TEXT NOT NULL,
  projection_contract_version TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  authority_state abarva_authority_state NOT NULL,
  freshness_state abarva_freshness_state NOT NULL,
  availability_state abarva_availability_state NOT NULL,
  evidence_coverage NUMERIC(5,4),
  content_hash TEXT NOT NULL,
  edge_ref TEXT NOT NULL,
  from_node_ref TEXT NOT NULL,
  to_node_ref TEXT NOT NULL,
  relationship_type_ref TEXT NOT NULL,
  current_target_state abarva_current_target_state NOT NULL DEFAULT 'unknown',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, knowledge_baseline_ref, edge_ref),
  FOREIGN KEY (tenant_key, knowledge_baseline_ref, from_node_ref) REFERENCES consumption.relationship_node_v1 (tenant_key, knowledge_baseline_ref, node_ref),
  FOREIGN KEY (tenant_key, knowledge_baseline_ref, to_node_ref) REFERENCES consumption.relationship_node_v1 (tenant_key, knowledge_baseline_ref, node_ref),
  FOREIGN KEY (relationship_type_ref) REFERENCES knowledge.relationship_type (relationship_type_ref),
  CHECK (from_node_ref <> to_node_ref)
);

CREATE TABLE IF NOT EXISTS consumption.relationship_evidence_v1 (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  edge_ref TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  citation_label TEXT NOT NULL,
  source_ref TEXT,
  source_version_ref TEXT,
  evidence_text TEXT,
  evidence_hash TEXT NOT NULL,
  authority_state abarva_authority_state NOT NULL DEFAULT 'accepted',
  PRIMARY KEY (tenant_key, knowledge_baseline_ref, edge_ref, evidence_ref),
  FOREIGN KEY (tenant_key, knowledge_baseline_ref, edge_ref) REFERENCES consumption.relationship_edge_v1 (tenant_key, knowledge_baseline_ref, edge_ref)
);

CREATE TABLE IF NOT EXISTS consumption.consumer_reconciliation_ledger (
  tenant_key TEXT NOT NULL,
  reconciliation_ref TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  projection_name TEXT NOT NULL,
  canonical_hash TEXT,
  publication_hash TEXT,
  consumption_hash TEXT,
  cube_hash TEXT,
  api_hash TEXT,
  ui_hash TEXT,
  canonical_count BIGINT,
  consumption_count BIGINT,
  cube_count BIGINT,
  reconciliation_state abarva_run_state NOT NULL DEFAULT 'planned',
  failure_detail TEXT,
  checked_run_ref TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, reconciliation_ref),
  FOREIGN KEY (tenant_key, checked_run_ref) REFERENCES operations.run (tenant_key, run_ref)
);

CREATE TABLE IF NOT EXISTS audit.lineage_event (
  tenant_key TEXT NOT NULL,
  lineage_ref TEXT NOT NULL,
  run_ref TEXT,
  source_ref TEXT,
  source_version_ref TEXT,
  evidence_ref TEXT,
  candidate_ref TEXT,
  canonical_object_ref TEXT,
  domain_publication_ref TEXT,
  knowledge_baseline_ref TEXT,
  projection_version_ref TEXT,
  consumer_surface TEXT,
  content_hash TEXT,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, lineage_ref)
);

CREATE TABLE IF NOT EXISTS operations.graph_traversal_telemetry (
  tenant_key TEXT NOT NULL,
  traversal_ref TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  start_node_ref TEXT NOT NULL,
  max_hops INTEGER NOT NULL,
  result_limit INTEGER NOT NULL,
  result_count BIGINT,
  elapsed_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, traversal_ref),
  CHECK (max_hops BETWEEN 1 AND 4),
  CHECK (result_limit BETWEEN 1 AND 1000)
);

CREATE INDEX IF NOT EXISTS source_version_source_idx
  ON source_registry.source_version (tenant_key, source_ref, version_number DESC);

CREATE INDEX IF NOT EXISTS evidence_item_source_idx
  ON evidence.evidence_item (tenant_key, source_version_ref, authority_state);

CREATE INDEX IF NOT EXISTS entity_type_idx
  ON knowledge.entity (tenant_key, entity_type, authority_state);

CREATE INDEX IF NOT EXISTS fact_entity_idx
  ON knowledge.fact_assertion (tenant_key, entity_ref, fact_type, authority_state);

CREATE INDEX IF NOT EXISTS relationship_from_idx
  ON knowledge.relationship_assertion (tenant_key, from_entity_ref, relationship_type_ref, authority_state);

CREATE INDEX IF NOT EXISTS relationship_to_idx
  ON knowledge.relationship_assertion (tenant_key, to_entity_ref, relationship_type_ref, authority_state);

CREATE INDEX IF NOT EXISTS metric_observation_metric_idx
  ON metrics.metric_observation (tenant_key, metric_ref, period_start, period_end, authority_state);

CREATE INDEX IF NOT EXISTS projection_version_lookup_idx
  ON publication.projection_version (tenant_key, knowledge_baseline_ref, projection_name, build_state);

CREATE INDEX IF NOT EXISTS relationship_node_lookup_idx
  ON consumption.relationship_node_v1 (tenant_key, knowledge_baseline_ref, entity_ref, node_type, authority_state);

CREATE INDEX IF NOT EXISTS relationship_edge_from_idx
  ON consumption.relationship_edge_v1 (tenant_key, knowledge_baseline_ref, from_node_ref, relationship_type_ref, authority_state, current_target_state);

CREATE INDEX IF NOT EXISTS relationship_edge_to_idx
  ON consumption.relationship_edge_v1 (tenant_key, knowledge_baseline_ref, to_node_ref, relationship_type_ref, authority_state, current_target_state);

CREATE INDEX IF NOT EXISTS relationship_edge_evidence_idx
  ON consumption.relationship_evidence_v1 (tenant_key, knowledge_baseline_ref, edge_ref, evidence_ref);

CREATE OR REPLACE FUNCTION publication.activate_knowledge_baseline(
  p_tenant_key TEXT,
  p_knowledge_baseline_ref TEXT,
  p_activation_ref TEXT,
  p_run_ref TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  previous_ref TEXT;
BEGIN
  IF p_tenant_key IS NULL OR p_tenant_key = '' OR p_tenant_key = 'all' OR p_tenant_key LIKE '%*%' THEN
    RAISE EXCEPTION 'Wildcard tenant execution is not allowed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM publication.knowledge_baseline
    WHERE tenant_key = p_tenant_key
      AND knowledge_baseline_ref = p_knowledge_baseline_ref
      AND baseline_state = 'passed'
  ) THEN
    RAISE EXCEPTION 'Knowledge Baseline % is not eligible for activation', p_knowledge_baseline_ref;
  END IF;

  SELECT knowledge_baseline_ref
    INTO previous_ref
  FROM publication.knowledge_baseline
  WHERE tenant_key = p_tenant_key
    AND is_active = true
  FOR UPDATE;

  UPDATE publication.knowledge_baseline
  SET is_active = false
  WHERE tenant_key = p_tenant_key
    AND is_active = true;

  UPDATE publication.knowledge_baseline
  SET is_active = true,
      baseline_state = 'passed',
      activated_run_ref = p_run_ref,
      activated_at = now()
  WHERE tenant_key = p_tenant_key
    AND knowledge_baseline_ref = p_knowledge_baseline_ref;

  INSERT INTO publication.publication_activation (
    tenant_key,
    activation_ref,
    knowledge_baseline_ref,
    previous_knowledge_baseline_ref,
    activation_state,
    activated_run_ref,
    activated_at
  )
  VALUES (
    p_tenant_key,
    p_activation_ref,
    p_knowledge_baseline_ref,
    previous_ref,
    'passed',
    p_run_ref,
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION consumption.validate_relationship_publication_v1(
  p_tenant_key TEXT,
  p_knowledge_baseline_ref TEXT
) RETURNS TABLE (
  check_name TEXT,
  issue_count BIGINT
)
LANGUAGE sql
AS $$
  SELECT
    'broken_from_endpoint'::text AS check_name,
    count(*)::bigint AS issue_count
  FROM consumption.relationship_edge_v1 e
  LEFT JOIN consumption.relationship_node_v1 n
    ON n.tenant_key = e.tenant_key
   AND n.knowledge_baseline_ref = e.knowledge_baseline_ref
   AND n.node_ref = e.from_node_ref
  WHERE e.tenant_key = p_tenant_key
    AND e.knowledge_baseline_ref = p_knowledge_baseline_ref
    AND n.node_ref IS NULL
  UNION ALL
  SELECT
    'broken_to_endpoint'::text AS check_name,
    count(*)::bigint AS issue_count
  FROM consumption.relationship_edge_v1 e
  LEFT JOIN consumption.relationship_node_v1 n
    ON n.tenant_key = e.tenant_key
   AND n.knowledge_baseline_ref = e.knowledge_baseline_ref
   AND n.node_ref = e.to_node_ref
  WHERE e.tenant_key = p_tenant_key
    AND e.knowledge_baseline_ref = p_knowledge_baseline_ref
    AND n.node_ref IS NULL
  UNION ALL
  SELECT
    'inactive_or_candidate_edges'::text AS check_name,
    count(*)::bigint AS issue_count
  FROM consumption.relationship_edge_v1
  WHERE tenant_key = p_tenant_key
    AND knowledge_baseline_ref = p_knowledge_baseline_ref
    AND authority_state <> 'accepted'
  UNION ALL
  SELECT
    'missing_edge_evidence'::text AS check_name,
    count(*)::bigint AS issue_count
  FROM consumption.relationship_edge_v1 e
  LEFT JOIN consumption.relationship_evidence_v1 ev
    ON ev.tenant_key = e.tenant_key
   AND ev.knowledge_baseline_ref = e.knowledge_baseline_ref
   AND ev.edge_ref = e.edge_ref
  WHERE e.tenant_key = p_tenant_key
    AND e.knowledge_baseline_ref = p_knowledge_baseline_ref
    AND ev.edge_ref IS NULL;
$$;

CREATE OR REPLACE FUNCTION consumption.relationship_neighbors_v1(
  p_tenant_key TEXT,
  p_knowledge_baseline_ref TEXT,
  p_start_node_ref TEXT,
  p_max_hops INTEGER DEFAULT 2,
  p_result_limit INTEGER DEFAULT 250,
  p_state_filter abarva_current_target_state DEFAULT NULL
) RETURNS TABLE (
  depth INTEGER,
  path_node_refs TEXT[],
  edge_ref TEXT,
  from_node_ref TEXT,
  to_node_ref TEXT,
  relationship_type_ref TEXT,
  current_target_state abarva_current_target_state,
  evidence_refs TEXT[]
)
LANGUAGE sql
AS $$
  WITH RECURSIVE walk AS (
    SELECT
      1 AS depth,
      ARRAY[e.from_node_ref, e.to_node_ref] AS path_node_refs,
      e.edge_ref,
      e.from_node_ref,
      e.to_node_ref,
      e.relationship_type_ref,
      e.current_target_state,
      e.evidence_refs
    FROM consumption.relationship_edge_v1 e
    JOIN publication.knowledge_baseline b
      ON b.tenant_key = e.tenant_key
     AND b.knowledge_baseline_ref = e.knowledge_baseline_ref
     AND b.is_active = true
    WHERE e.tenant_key = p_tenant_key
      AND e.knowledge_baseline_ref = p_knowledge_baseline_ref
      AND e.from_node_ref = p_start_node_ref
      AND e.authority_state = 'accepted'
      AND (p_state_filter IS NULL OR e.current_target_state = p_state_filter)
    UNION ALL
    SELECT
      w.depth + 1,
      w.path_node_refs || e.to_node_ref,
      e.edge_ref,
      e.from_node_ref,
      e.to_node_ref,
      e.relationship_type_ref,
      e.current_target_state,
      e.evidence_refs
    FROM walk w
    JOIN consumption.relationship_edge_v1 e
      ON e.tenant_key = p_tenant_key
     AND e.knowledge_baseline_ref = p_knowledge_baseline_ref
     AND e.from_node_ref = w.to_node_ref
     AND e.authority_state = 'accepted'
    WHERE w.depth < LEAST(GREATEST(p_max_hops, 1), 4)
      AND NOT e.to_node_ref = ANY(w.path_node_refs)
      AND (p_state_filter IS NULL OR e.current_target_state = p_state_filter)
  )
  SELECT *
  FROM walk
  ORDER BY depth, edge_ref
  LIMIT LEAST(GREATEST(p_result_limit, 1), 1000);
$$;

COMMIT;
