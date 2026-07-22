-- Home Knowledge Pack v3 enrichment
--
-- Additive schema for the CXO-quality tenant knowledge pack content that the
-- v2 schema (20260721183000_home_knowledge_pack_v2.sql) has no typed home
-- for: executive takeaways, enterprise/operating model narrative items,
-- unified strategic narratives (industry movements, new ways of operating,
-- change theses), per-dimension visual specifications, human-readable
-- relationship-path explanations, cross-module implications, and next-
-- evidence requests. All tables cascade from home_knowledge_packs and carry
-- a denormalized tenant_key, matching the v2 schema's existing convention.
--
-- Claude fills these tables during offline pack generation; it does not
-- touch home_knowledge_dimensions.record_count, home_knowledge_relationship_
-- nodes/edges, or any other deterministically-computed fact column. This
-- migration only adds narrative/interpretation surface area, not new fact
-- sources.

BEGIN;

CREATE TABLE IF NOT EXISTS public.home_knowledge_executive_takeaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'strategic_inference'
    CHECK (classification IN ('loaded_fact', 'derived_measure', 'industry_pattern', 'strategic_inference', 'missing_evidence')),
  affected_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC,
  why_it_matters TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_executive_takeaways_pack_idx
  ON public.home_knowledge_executive_takeaways (tenant_key, pack_id, sort_order);

CREATE TABLE IF NOT EXISTS public.home_knowledge_next_evidence_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  title TEXT NOT NULL,
  narrative TEXT,
  requesting_dimension_key TEXT,
  unlocks_narrative TEXT,
  requesting_role_hint TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_next_evidence_requests_pack_idx
  ON public.home_knowledge_next_evidence_requests (tenant_key, pack_id, sort_order);

CREATE TABLE IF NOT EXISTS public.home_knowledge_enterprise_model_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  item_type TEXT NOT NULL
    CHECK (item_type IN (
      'division', 'business_unit', 'office_segment', 'business_capability',
      'ownership_decision_right', 'geography_or_legal_entity'
    )),
  name TEXT NOT NULL,
  narrative TEXT,
  classification TEXT NOT NULL DEFAULT 'derived_measure'
    CHECK (classification IN ('loaded_fact', 'derived_measure', 'industry_pattern', 'strategic_inference', 'missing_evidence')),
  related_dimension_key TEXT,
  related_row_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_enterprise_model_items_pack_idx
  ON public.home_knowledge_enterprise_model_items (tenant_key, pack_id, item_type);

CREATE TABLE IF NOT EXISTS public.home_knowledge_operating_model_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  item_type TEXT NOT NULL
    CHECK (item_type IN (
      'value_stream', 'process', 'process_handoff', 'workforce_role',
      'service_delivery_model', 'outsourced_work', 'managed_service_dependency',
      'operational_bottleneck', 'control_point', 'missing_process_evidence'
    )),
  name TEXT NOT NULL,
  narrative TEXT,
  classification TEXT NOT NULL DEFAULT 'derived_measure'
    CHECK (classification IN ('loaded_fact', 'derived_measure', 'industry_pattern', 'strategic_inference', 'missing_evidence')),
  related_dimension_key TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_operating_model_items_pack_idx
  ON public.home_knowledge_operating_model_items (tenant_key, pack_id, item_type);

-- Industry movements (E), new ways of operating (F), and change theses (G)
-- share the same shape at a meta level: a title, a current condition, a
-- target condition or relevance, a set of affected entities, a value
-- hypothesis or set of implications, dependencies, and an evidence gate.
-- Unifying them avoids three near-duplicate tables; narrative_type
-- distinguishes them for querying and rendering.
CREATE TABLE IF NOT EXISTS public.home_knowledge_strategic_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  narrative_type TEXT NOT NULL
    CHECK (narrative_type IN ('industry_movement', 'new_way_of_operating', 'change_thesis')),
  title TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'strategic_inference'
    CHECK (classification IN ('loaded_fact', 'derived_measure', 'industry_pattern', 'strategic_inference', 'missing_evidence')),
  executive_narrative TEXT NOT NULL,
  current_state TEXT,
  target_state_or_relevance TEXT,
  affected_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  value_hypothesis TEXT,
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_gate TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC,
  recommended_next_action TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_strategic_narratives_pack_idx
  ON public.home_knowledge_strategic_narratives (tenant_key, pack_id, narrative_type, sort_order);

-- One row per (dimension, primary/secondary) visualization recommendation.
CREATE TABLE IF NOT EXISTS public.home_knowledge_dimension_visual_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  spec_rank INTEGER NOT NULL DEFAULT 1 CHECK (spec_rank IN (1, 2)),
  visual_type TEXT NOT NULL,
  executive_question TEXT,
  title TEXT,
  subtitle TEXT,
  data_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  grouping TEXT,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  encoding JSONB NOT NULL DEFAULT '{}'::jsonb,
  annotation TEXT,
  empty_state TEXT,
  evidence_disclosure TEXT,
  drill_down_target TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, dimension_key, spec_rank)
);

CREATE INDEX IF NOT EXISTS home_knowledge_dimension_visual_specs_pack_idx
  ON public.home_knowledge_dimension_visual_specs (tenant_key, pack_id, dimension_key);

-- Human-readable explanation of an important graph path. edge_keys is an
-- ordered array referencing home_knowledge_relationship_edges.edge_key
-- (one entry for a single edge, multiple for a multi-hop path); source/
-- relationship/target are denormalized for direct display without a join.
CREATE TABLE IF NOT EXISTS public.home_knowledge_relationship_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  edge_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_entity TEXT NOT NULL,
  relationship TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC,
  affected_use_case_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  affected_strategic_narrative_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_relationship_explanations_pack_idx
  ON public.home_knowledge_relationship_explanations (tenant_key, pack_id, sort_order);

CREATE TABLE IF NOT EXISTS public.home_knowledge_module_implications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('intelligence', 'moves', 'source', 'tower')),
  narrative TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, module)
);

CREATE INDEX IF NOT EXISTS home_knowledge_module_implications_pack_idx
  ON public.home_knowledge_module_implications (tenant_key, pack_id);

-- Section I (dimension stories) needs a strategic interpretation and an
-- evidence-gap summary beyond what v2's executive_summary/cxo_meaning/
-- why_it_matters already cover.
ALTER TABLE public.home_knowledge_dimensions
  ADD COLUMN IF NOT EXISTS strategic_interpretation TEXT,
  ADD COLUMN IF NOT EXISTS evidence_gap_summary TEXT;

-- Section H (strategic use cases) needs an explicit category (not every use
-- case is AI) and an office-segment tag; richer "affected X" breakdowns
-- reuse the existing required_context JSONB catch-all rather than adding a
-- narrow column per entity type.
ALTER TABLE public.home_knowledge_use_cases
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IS NULL OR category IN (
      'workflow_transformation', 'decision_intelligence', 'operating_model_redesign',
      'automation', 'sourcing_optimization', 'data_foundation', 'platform_modernization',
      'risk_and_control_modernization', 'ai_enabled_transformation'
    )),
  ADD COLUMN IF NOT EXISTS office_segment TEXT;

-- Section A wants unresolved executive questions surfaced at the pack level
-- (a short list, not a full entity type of its own).
ALTER TABLE public.home_knowledge_packs
  ADD COLUMN IF NOT EXISTS unresolved_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
