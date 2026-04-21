BEGIN;

CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_user_touchpoint_at TIMESTAMPTZ,
  next_scheduled_refresh_at TIMESTAMPTZ,
  composition_mode TEXT NOT NULL DEFAULT 'full_briefing',
  target_reading_time_seconds INT NOT NULL DEFAULT 240,
  estimated_reading_time_seconds INT NOT NULL DEFAULT 240,
  opening_line TEXT NOT NULL DEFAULT '',
  closing_recommendation TEXT NOT NULL DEFAULT '',
  voice_profile_applied TEXT,
  user_viewed_at TIMESTAMPTZ,
  user_dwell_time_seconds INT,
  user_clicked_sections UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  user_followup_queries TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  user_dismissed_items UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  user_feedback TEXT,
  source_entities_considered INT NOT NULL DEFAULT 0,
  source_events_considered INT NOT NULL DEFAULT 0,
  ranking_model_version TEXT NOT NULL DEFAULT 'wave2-v1',
  personalization_model_version TEXT NOT NULL DEFAULT 'wave2-v1',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE briefings
    ADD CONSTRAINT briefings_composition_mode_check CHECK (
      composition_mode IN ('full_briefing', 'catch_up', 'quick_update', 'event_driven')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE briefings
    ADD CONSTRAINT briefings_user_feedback_check CHECK (
      user_feedback IS NULL OR user_feedback IN ('helpful', 'redundant', 'incomplete', 'other')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_briefings_client_generated ON briefings(client_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefings_user_generated ON briefings(user_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS briefing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  included BOOLEAN NOT NULL DEFAULT true,
  item_count INT NOT NULL DEFAULT 0,
  section_headline TEXT NOT NULL DEFAULT '',
  section_reading_time_seconds INT NOT NULL DEFAULT 0,
  ordinal INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE briefing_sections
    ADD CONSTRAINT briefing_sections_category_check CHECK (
      category IN (
        'kpi_drift', 'pattern_shift', 'peer_move',
        'regulatory_change', 'commitment_status', 'contradiction_emergence'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS briefing_sections_briefing_category_key
  ON briefing_sections(briefing_id, category);
CREATE INDEX IF NOT EXISTS idx_briefing_sections_briefing_ordinal
  ON briefing_sections(briefing_id, ordinal);

CREATE TABLE IF NOT EXISTS briefing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES briefing_sections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  headline TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  why_it_matters TEXT NOT NULL DEFAULT '',
  recommended_action TEXT NOT NULL DEFAULT '',
  primary_source_entity TEXT,
  supporting_evidence TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  linked_entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  priority_score INT NOT NULL DEFAULT 0,
  urgency_score INT NOT NULL DEFAULT 0,
  familiarity_to_user TEXT NOT NULL DEFAULT 'sensed',
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_mode TEXT NOT NULL DEFAULT 'full',
  user_clicked BOOLEAN NOT NULL DEFAULT false,
  user_dismissed BOOLEAN NOT NULL DEFAULT false,
  user_asked_followup BOOLEAN NOT NULL DEFAULT false,
  ordinal INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE briefing_items
    ADD CONSTRAINT briefing_items_category_check CHECK (
      category IN (
        'kpi_drift', 'pattern_shift', 'peer_move',
        'regulatory_change', 'commitment_status', 'contradiction_emergence'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE briefing_items
    ADD CONSTRAINT briefing_items_familiarity_check CHECK (
      familiarity_to_user IN ('known', 'sensed', 'new')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE briefing_items
    ADD CONSTRAINT briefing_items_disclosure_mode_check CHECK (
      disclosure_mode IN ('full', 'informed_indirection', 'reasoning_only_acknowledge', 'suppressed')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_briefing_items_briefing_section ON briefing_items(briefing_id, section_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_briefing_items_scopes ON briefing_items(reasoning_scope_id, disclosure_scope_id);

CREATE TABLE IF NOT EXISTS briefing_compositions (
  briefing_id UUID PRIMARY KEY REFERENCES briefings(id) ON DELETE CASCADE,
  composition_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_composition_time_ms INT NOT NULL DEFAULT 0,
  total_source_entities_scanned INT NOT NULL DEFAULT 0,
  filtering_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_briefing_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  preferred_length TEXT NOT NULL DEFAULT 'standard',
  category_weights JSONB NOT NULL DEFAULT '{
    "kpi_drift": 1,
    "pattern_shift": 1,
    "peer_move": 1,
    "regulatory_change": 1,
    "commitment_status": 1,
    "contradiction_emergence": 1
  }'::jsonb,
  always_include_entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  never_include_entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  preferred_generation_time TEXT,
  delivery_channel TEXT NOT NULL DEFAULT 'in_app',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE user_briefing_preferences
    ADD CONSTRAINT user_briefing_preferences_length_check CHECK (
      preferred_length IN ('brief', 'standard', 'deep')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE user_briefing_preferences
    ADD CONSTRAINT user_briefing_preferences_delivery_channel_check CHECK (
      delivery_channel IN ('in_app', 'email', 'both')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_briefing_preferences_user_client_key
  ON user_briefing_preferences(user_id, coalesce(client_id::text, 'global'));

DROP TRIGGER IF EXISTS briefings_set_updated_at ON briefings;
CREATE TRIGGER briefings_set_updated_at BEFORE UPDATE ON briefings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS briefing_sections_set_updated_at ON briefing_sections;
CREATE TRIGGER briefing_sections_set_updated_at BEFORE UPDATE ON briefing_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS briefing_items_set_updated_at ON briefing_items;
CREATE TRIGGER briefing_items_set_updated_at BEFORE UPDATE ON briefing_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS briefing_compositions_set_updated_at ON briefing_compositions;
CREATE TRIGGER briefing_compositions_set_updated_at BEFORE UPDATE ON briefing_compositions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS user_briefing_preferences_set_updated_at ON user_briefing_preferences;
CREATE TRIGGER user_briefing_preferences_set_updated_at BEFORE UPDATE ON user_briefing_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_briefing_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_briefings" ON briefings;
CREATE POLICY "service_role_all_briefings" ON briefings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_briefing_sections" ON briefing_sections;
CREATE POLICY "service_role_all_briefing_sections" ON briefing_sections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_briefing_items" ON briefing_items;
CREATE POLICY "service_role_all_briefing_items" ON briefing_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_briefing_compositions" ON briefing_compositions;
CREATE POLICY "service_role_all_briefing_compositions" ON briefing_compositions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_user_briefing_preferences" ON user_briefing_preferences;
CREATE POLICY "service_role_all_user_briefing_preferences" ON user_briefing_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
