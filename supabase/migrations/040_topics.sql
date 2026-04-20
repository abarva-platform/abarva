-- Migration 040 · Pack L · Topic intelligence layer
-- Schema verbatim from the spec (Anand guidance 2026-04-20). v1 seeds a
-- subset of columns; the empty JSONB fields fill in as the topic catalog
-- matures. Schema-now-content-later — cheaper than late ALTER TABLE.

BEGIN;

CREATE TABLE IF NOT EXISTS topics (
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

CREATE INDEX IF NOT EXISTS idx_topics_industries ON topics USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_topics_key_patterns ON topics USING GIN(key_patterns);
CREATE INDEX IF NOT EXISTS idx_topics_key_lower ON topics(lower(topic_key));

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_topics" ON topics;
CREATE POLICY "service_role_all_topics" ON topics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Join table: which topics are assigned to which engagement + how the
-- diagnostic-question workbook has progressed.
CREATE TABLE IF NOT EXISTS engagement_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  UNIQUE(engagement_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_topics_engagement ON engagement_topics(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_topics_topic ON engagement_topics(topic_id);

ALTER TABLE engagement_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_engagement_topics" ON engagement_topics;
CREATE POLICY "service_role_all_engagement_topics" ON engagement_topics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger on topics
CREATE OR REPLACE FUNCTION set_topics_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_topics_updated_at ON topics;
CREATE TRIGGER trg_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION set_topics_updated_at();

NOTIFY pgrst, 'reload schema';

COMMIT;
