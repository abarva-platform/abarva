-- Home Knowledge Pack v2
--
-- Additive governed read model for the Home / Knowledge CXO cockpit.
-- The tables below are intentionally pack-versioned so Home can render a
-- single approved context pack per tenant while preserving draft/candidate
-- generations, Claude prompt metadata, evidence lineage, and rollback history.

BEGIN;

CREATE TABLE IF NOT EXISTS public.home_knowledge_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  pack_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('draft', 'candidate', 'approved', 'retired')),
  artifact_type TEXT NOT NULL DEFAULT 'NexusHomeKnowledgePackV2',
  source_pack_hash TEXT NOT NULL,
  source_dataset_version TEXT,
  source_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  generator_version TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  generated_model TEXT,
  claude_model TEXT,
  claude_prompt_version TEXT,
  claude_prompt_hash TEXT,
  content_hash TEXT NOT NULL,
  render_pack JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_score NUMERIC,
  quality_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'pass', 'warn', 'fail')),
  validation_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, pack_version)
);

CREATE UNIQUE INDEX IF NOT EXISTS home_knowledge_packs_one_active_approved
  ON public.home_knowledge_packs (tenant_key)
  WHERE status = 'approved' AND effective_to IS NULL;

CREATE INDEX IF NOT EXISTS home_knowledge_packs_tenant_status_idx
  ON public.home_knowledge_packs (tenant_key, status, effective_from DESC);

CREATE TABLE IF NOT EXISTS public.home_knowledge_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  confidence_status TEXT NOT NULL DEFAULT 'directional',
  pct TEXT,
  executive_summary TEXT,
  cxo_meaning TEXT,
  why_it_matters TEXT,
  visual_type TEXT,
  covers JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, dimension_key)
);

CREATE INDEX IF NOT EXISTS home_knowledge_dimensions_tenant_idx
  ON public.home_knowledge_dimensions (tenant_key, dimension_key);

CREATE TABLE IF NOT EXISTS public.home_knowledge_dimension_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  source_record_id TEXT,
  display_name TEXT NOT NULL,
  display_summary TEXT,
  facet_1 TEXT,
  facet_2 TEXT,
  status TEXT,
  confidence NUMERIC,
  display_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_file TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_dimension_rows_pack_dimension_idx
  ON public.home_knowledge_dimension_rows (pack_id, dimension_key, sort_order);

CREATE TABLE IF NOT EXISTS public.home_knowledge_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  use_case_key TEXT NOT NULL,
  name TEXT NOT NULL,
  business_function TEXT,
  owner_hint TEXT,
  stage TEXT,
  industry_pattern TEXT,
  client_context_signal TEXT,
  why_now TEXT,
  operating_model_change TEXT,
  change_strategy TEXT,
  value_thesis TEXT,
  readiness_barrier TEXT,
  evidence_gate TEXT,
  priority_rank INTEGER NOT NULL,
  value_score NUMERIC NOT NULL DEFAULT 0,
  readiness_score NUMERIC NOT NULL DEFAULT 0,
  evidence_score NUMERIC NOT NULL DEFAULT 0,
  dependency_risk_score NUMERIC NOT NULL DEFAULT 0,
  total_priority_score NUMERIC NOT NULL DEFAULT 0,
  priority_rationale TEXT,
  module_next_step TEXT,
  supporting_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, use_case_key)
);

CREATE INDEX IF NOT EXISTS home_knowledge_use_cases_rank_idx
  ON public.home_knowledge_use_cases (tenant_key, pack_id, priority_rank);

CREATE TABLE IF NOT EXISTS public.home_knowledge_evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  storage_uri TEXT,
  byte_size BIGINT,
  row_count INTEGER,
  loaded_by TEXT,
  loaded_at TIMESTAMPTZ,
  source_date TEXT,
  source_owner TEXT,
  source_status TEXT,
  checksum TEXT,
  parsed_into_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  known_gaps TEXT,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, source_id)
);

CREATE INDEX IF NOT EXISTS home_knowledge_evidence_sources_tenant_idx
  ON public.home_knowledge_evidence_sources (tenant_key, pack_id);

CREATE TABLE IF NOT EXISTS public.home_knowledge_relationship_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  node_key TEXT NOT NULL,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  group_name TEXT,
  size_score NUMERIC NOT NULL DEFAULT 1,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC,
  display_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, node_key)
);

CREATE INDEX IF NOT EXISTS home_knowledge_relationship_nodes_type_idx
  ON public.home_knowledge_relationship_nodes (tenant_key, pack_id, node_type);

CREATE TABLE IF NOT EXISTS public.home_knowledge_relationship_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  edge_key TEXT NOT NULL,
  from_node_key TEXT NOT NULL,
  to_node_key TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  relationship_strength TEXT,
  evidence_basis TEXT,
  confidence NUMERIC,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, edge_key)
);

CREATE INDEX IF NOT EXISTS home_knowledge_relationship_edges_from_idx
  ON public.home_knowledge_relationship_edges (tenant_key, pack_id, from_node_key);

CREATE INDEX IF NOT EXISTS home_knowledge_relationship_edges_to_idx
  ON public.home_knowledge_relationship_edges (tenant_key, pack_id, to_node_key);

CREATE TABLE IF NOT EXISTS public.home_knowledge_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  dimension_key TEXT,
  title TEXT,
  narrative TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  prompt_version TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_status TEXT NOT NULL DEFAULT 'candidate'
    CHECK (approval_status IN ('candidate', 'approved', 'rejected')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS home_knowledge_narratives_unique_idx
  ON public.home_knowledge_narratives (pack_id, section_key, COALESCE(dimension_key, ''));

CREATE INDEX IF NOT EXISTS home_knowledge_narratives_section_idx
  ON public.home_knowledge_narratives (tenant_key, pack_id, section_key);

CREATE OR REPLACE VIEW public.v_home_knowledge_approved_packs AS
SELECT *
FROM public.home_knowledge_packs
WHERE status = 'approved'
  AND effective_to IS NULL;

COMMIT;
