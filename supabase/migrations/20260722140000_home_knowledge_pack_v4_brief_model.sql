-- Home Knowledge Pack v4 brief model
--
-- Adds the authored content structures the redesigned Enterprise Brief
-- ("Home Enterprise Brief (offline)") template binds to but which neither
-- the v2 base schema (20260721183000) nor the v3 enrichment (20260722020000)
-- produced: the executive-read block (archetype, one-sentence, tension
-- headline, proven strengths, structural constraints, industry-force vs
-- tenant-reality pairs, leadership-sequence horizons), the pack-level load
-- tier + activation conditions that let one template serve rich (Meridian)
-- and thin (Lakeshore) tenants honestly, a curated data/AI-foundation
-- summary, and per-dimension AI-readiness scores and module implications.
--
-- Grounding note carried from the review: strengths and AI-readiness are the
-- two surfaces most prone to drift. A strength must cite loaded evidence of
-- something actually working (adoption/usage/coverage), not a hopeful
-- restatement of intent; an AI-readiness score must derive from a stated
-- basis, never a fabricated number. Both columns carry an evidence_refs /
-- basis field for exactly this reason, and the generation prompt enforces it.

BEGIN;

-- Pack-level executive-read block. One row per pack. Arrays are ordered.
CREATE TABLE IF NOT EXISTS public.home_knowledge_executive_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  archetype TEXT,
  one_sentence TEXT,
  tension_headline TEXT,
  context_confidence_pct INTEGER
    CHECK (context_confidence_pct IS NULL OR (context_confidence_pct BETWEEN 0 AND 100)),
  context_confidence_note TEXT,
  data_foundation_summary TEXT,
  -- Each element: { "text": "...", "evidence_refs": [...] }
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Ordered "industry is moving to X" / "tenant is at Y" pair lists.
  industry_forces JSONB NOT NULL DEFAULT '[]'::jsonb,
  tenant_reality JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each element: { "horizon": "Act now|Build next|...", "tone":
  -- "option|evidence|...", "items": ["...", ...] }
  horizons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id)
);

CREATE INDEX IF NOT EXISTS home_knowledge_executive_read_tenant_idx
  ON public.home_knowledge_executive_read (tenant_key, pack_id);

-- Pack-level load tier. Drives the "same template, whatever tier its context
-- is loaded to" behavior in the design (thin/partial/rich), so a sparse
-- tenant renders a useful loaded-tier brief instead of a broken/empty page.
CREATE TABLE IF NOT EXISTS public.home_knowledge_pack_tier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'partial'
    CHECK (tier IN ('thin', 'partial', 'rich')),
  tier_label TEXT,
  tier_title TEXT,
  tier_body TEXT,
  -- Ordered list of plain-English activation conditions ({ "text": "..." }).
  tier_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  tier_basis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id)
);

CREATE INDEX IF NOT EXISTS home_knowledge_pack_tier_tenant_idx
  ON public.home_knowledge_pack_tier (tenant_key, pack_id);

-- Per-dimension AI-readiness score. Separate from the qualitative
-- confidence_status on home_knowledge_dimensions -- this is the design's
-- "AI readiness by dimension" bar/radar. basis is REQUIRED content-side (the
-- generation prompt refuses to emit a score without one); nullable here so
-- the column can also hold a deterministically-derived score later.
CREATE TABLE IF NOT EXISTS public.home_knowledge_ai_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  readiness_dimension TEXT NOT NULL,
  score_pct INTEGER NOT NULL CHECK (score_pct BETWEEN 0 AND 100),
  tone TEXT CHECK (tone IS NULL OR tone IN ('red', 'amber', 'green')),
  label TEXT,
  basis TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, readiness_dimension)
);

CREATE INDEX IF NOT EXISTS home_knowledge_ai_readiness_pack_idx
  ON public.home_knowledge_ai_readiness (tenant_key, pack_id, sort_order);

-- Per-dimension module implications. v3's home_knowledge_module_implications
-- is pack-level (4 rows); the design's dimension detail view wants "improves
-- these modules" scoped to each dimension. dimension_key = NULL is allowed
-- for a pack-level statement, preserving the v3 use case too.
CREATE TABLE IF NOT EXISTS public.home_knowledge_dimension_module_implications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.home_knowledge_packs(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('intelligence', 'moves', 'source', 'tower')),
  implication TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, dimension_key, module)
);

CREATE INDEX IF NOT EXISTS home_knowledge_dimension_module_implications_idx
  ON public.home_knowledge_dimension_module_implications (tenant_key, pack_id, dimension_key);

COMMIT;
