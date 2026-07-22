-- Home Knowledge Pack read-model lookup indexes
--
-- The Home page resolves one approved pack, then reads typed child rows by
-- pack_id. Earlier indexes were mostly tenant_key-first, which is useful for
-- governance scans but weaker for the server-render read path once pack_id is
-- known. These additive indexes keep the Postgres-first loader fast without
-- changing the Home pack contract.

BEGIN;

CREATE INDEX IF NOT EXISTS home_knowledge_packs_active_approved_lookup_idx
  ON public.home_knowledge_packs (tenant_key, effective_from DESC, created_at DESC)
  WHERE status = 'approved' AND effective_to IS NULL;

CREATE INDEX IF NOT EXISTS home_knowledge_use_cases_pack_lookup_idx
  ON public.home_knowledge_use_cases (pack_id, priority_rank, name);

CREATE INDEX IF NOT EXISTS home_knowledge_evidence_sources_pack_lookup_idx
  ON public.home_knowledge_evidence_sources (pack_id, source_name);

CREATE INDEX IF NOT EXISTS home_knowledge_executive_read_pack_lookup_idx
  ON public.home_knowledge_executive_read (pack_id);

CREATE INDEX IF NOT EXISTS home_knowledge_pack_tier_pack_lookup_idx
  ON public.home_knowledge_pack_tier (pack_id);

CREATE INDEX IF NOT EXISTS home_knowledge_ai_readiness_pack_lookup_idx
  ON public.home_knowledge_ai_readiness (pack_id, sort_order, readiness_dimension);

CREATE INDEX IF NOT EXISTS home_knowledge_dimension_implications_pack_lookup_idx
  ON public.home_knowledge_dimension_module_implications (pack_id, dimension_key, sort_order);

CREATE INDEX IF NOT EXISTS home_knowledge_next_evidence_pack_lookup_idx
  ON public.home_knowledge_next_evidence_requests (pack_id, sort_order, title);

CREATE INDEX IF NOT EXISTS home_knowledge_strategic_narratives_pack_lookup_idx
  ON public.home_knowledge_strategic_narratives (pack_id, narrative_type, sort_order, title);

COMMIT;
