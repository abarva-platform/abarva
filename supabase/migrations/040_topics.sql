-- Migration 040 · Pack L · Topic intelligence + Deliverable specifications
-- Schema verbatim from abarva-pack-topics-deliverables.md (2026-04-19, 950-line
-- spec). v1 seeds a subset of JSONB columns; the empty fields fill in over
-- time as topics mature and deliverables accumulate.

BEGIN;

-- ── engagement_topics · catalog of expertise packs ────────────────────────
CREATE TABLE IF NOT EXISTS engagement_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  industries TEXT[] NOT NULL DEFAULT '{}',

  typical_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_patterns TEXT[] NOT NULL DEFAULT '{}',
  vendor_landscape JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnostic_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_contradictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  phase_playbook JSONB NOT NULL DEFAULT '{}'::jsonb,
  typical_deliverables TEXT[] NOT NULL DEFAULT '{}',
  success_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  failure_modes JSONB NOT NULL DEFAULT '[]'::jsonb,

  maturity_version INT NOT NULL DEFAULT 1,
  prior_engagement_refs UUID[] NOT NULL DEFAULT '{}',
  source_attribution TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_topics_industries ON engagement_topics USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_engagement_topics_patterns ON engagement_topics USING GIN(key_patterns);
CREATE INDEX IF NOT EXISTS idx_engagement_topics_key_lower ON engagement_topics(lower(topic_key));

ALTER TABLE engagement_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_engagement_topics" ON engagement_topics;
CREATE POLICY "service_role_all_engagement_topics" ON engagement_topics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── engagement_topics_map · join: engagement ↔ topic ──────────────────────
CREATE TABLE IF NOT EXISTS engagement_topics_map (
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  topic_key TEXT NOT NULL REFERENCES engagement_topics(topic_key) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  PRIMARY KEY (engagement_id, topic_key)
);

CREATE INDEX IF NOT EXISTS idx_etm_engagement ON engagement_topics_map(engagement_id);
CREATE INDEX IF NOT EXISTS idx_etm_topic_key ON engagement_topics_map(topic_key);

ALTER TABLE engagement_topics_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_engagement_topics_map" ON engagement_topics_map;
CREATE POLICY "service_role_all_engagement_topics_map" ON engagement_topics_map
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── deliverable_types · structured specifications ─────────────────────────
CREATE TABLE IF NOT EXISTS deliverable_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  applicable_phases INT[] NOT NULL DEFAULT '{}',
  applicable_topics TEXT[] NOT NULL DEFAULT '{}',
  template_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_data_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  quality_rubric JSONB NOT NULL DEFAULT '{}'::jsonb,
  generation_prompt_template TEXT,
  output_format TEXT CHECK (output_format IN ('markdown','docx','pptx','xlsx','pdf')) DEFAULT 'markdown',
  version INT NOT NULL DEFAULT 1,
  maturity TEXT CHECK (maturity IN ('draft','pilot','production','deprecated')) DEFAULT 'pilot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deliverable_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_deliverable_types" ON deliverable_types;
CREATE POLICY "service_role_all_deliverable_types" ON deliverable_types
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── deliverables · actual deliverables produced during engagements ────────
CREATE TABLE IF NOT EXISTS deliverables_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  deliverable_type_key TEXT NOT NULL REFERENCES deliverable_types(type_key),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft','in_review','signed_off','superseded')) DEFAULT 'draft',
  current_version INT NOT NULL DEFAULT 1,
  created_by TEXT,
  signed_off_by TEXT,
  signed_off_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_v2_engagement ON deliverables_v2(engagement_id);

ALTER TABLE deliverables_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_deliverables_v2" ON deliverables_v2;
CREATE POLICY "service_role_all_deliverables_v2" ON deliverables_v2
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── deliverable_versions · full history, content + quality score ──────────
CREATE TABLE IF NOT EXISTS deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables_v2(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content TEXT NOT NULL,
  structured_data JSONB,
  quality_score JSONB,
  quality_issues JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_from_context_hash TEXT,
  generation_trace_id UUID,
  UNIQUE (deliverable_id, version)
);

CREATE INDEX IF NOT EXISTS idx_deliverable_versions_deliverable ON deliverable_versions(deliverable_id);

ALTER TABLE deliverable_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_deliverable_versions" ON deliverable_versions;
CREATE POLICY "service_role_all_deliverable_versions" ON deliverable_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_engagement_topics_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_engagement_topics_updated_at ON engagement_topics;
CREATE TRIGGER trg_engagement_topics_updated_at BEFORE UPDATE ON engagement_topics
  FOR EACH ROW EXECUTE FUNCTION set_engagement_topics_updated_at();

CREATE OR REPLACE FUNCTION set_deliverables_v2_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_deliverables_v2_updated_at ON deliverables_v2;
CREATE TRIGGER trg_deliverables_v2_updated_at BEFORE UPDATE ON deliverables_v2
  FOR EACH ROW EXECUTE FUNCTION set_deliverables_v2_updated_at();

NOTIFY pgrst, 'reload schema';

COMMIT;
