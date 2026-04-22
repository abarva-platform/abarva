BEGIN;

CREATE TABLE IF NOT EXISTS executive_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL CHECK (profile_type IN ('real_world', 'composite_tenant')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  vip_profile_id UUID REFERENCES vip_profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  pronouns TEXT,
  current_role_title TEXT NOT NULL,
  current_company TEXT NOT NULL,
  current_tenure_start DATE,
  current_remit TEXT,
  reporting_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  strategic_priorities_personally_owned TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  initiatives_personally_sponsored TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  communication_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_patterns JSONB NOT NULL DEFAULT '{}'::jsonb,
  known_priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  known_constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  influential_voices JSONB NOT NULL DEFAULT '[]'::jsonb,
  abarva_relationship_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_material JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  profile_use_statement TEXT NOT NULL DEFAULT '',
  profile_non_use_statement TEXT NOT NULL DEFAULT '',
  human_reviewed_by TEXT,
  human_reviewed_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence TEXT NOT NULL DEFAULT 'medium',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_profiles_full_name_company_key
  ON executive_profiles(profile_type, lower(full_name), coalesce(client_id::text, 'global'));
CREATE UNIQUE INDEX IF NOT EXISTS executive_profiles_person_id_key
  ON executive_profiles(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_executive_profiles_type ON executive_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_executive_profiles_client ON executive_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_executive_profiles_scope ON executive_profiles(reasoning_scope_id, disclosure_scope_id);

CREATE TABLE IF NOT EXISTS executive_career_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
  ordinal SMALLINT NOT NULL DEFAULT 0,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  tenure_start DATE,
  tenure_end DATE,
  notable_accomplishments TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  exit_context TEXT CHECK (exit_context IN ('promotion', 'lateral', 'departure', 'retirement', 'company_exit'))
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_career_history_profile_ordinal_key
  ON executive_career_history(profile_id, ordinal);

CREATE TABLE IF NOT EXISTS executive_public_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
  ordinal SMALLINT NOT NULL DEFAULT 0,
  statement_summary TEXT NOT NULL,
  source TEXT NOT NULL,
  statement_date DATE,
  topic_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  commitment_quality TEXT CHECK (commitment_quality IN ('directional', 'specific', 'quantified')),
  evidence_id TEXT REFERENCES evidence(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_public_statements_profile_ordinal_key
  ON executive_public_statements(profile_id, ordinal);

CREATE TABLE IF NOT EXISTS executive_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
  related_profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (
    relationship_type IN ('mentor', 'peer', 'direct_report', 'board_member', 'external_advisor', 'adversary', 'ally')
  ),
  relationship_context TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium'
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_relationships_pair_key
  ON executive_relationships(profile_id, related_profile_id, relationship_type);

CREATE TABLE IF NOT EXISTS executive_interaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES executive_profiles(id) ON DELETE CASCADE,
  interaction_date DATE NOT NULL,
  interaction_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT,
  next_step TEXT,
  created_by TEXT NOT NULL DEFAULT 'anand'
);

CREATE INDEX IF NOT EXISTS idx_executive_interaction_log_profile_date
  ON executive_interaction_log(profile_id, interaction_date DESC);

CREATE TABLE IF NOT EXISTS executive_demo_persona_overrides (
  profile_id UUID PRIMARY KEY REFERENCES executive_profiles(id) ON DELETE CASCADE,
  use_preferred_name_in_greetings BOOLEAN NOT NULL DEFAULT true,
  specific_frames_to_open_with TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  topics_to_lead_with TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  sensitivities_to_acknowledge TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  avoid_framings TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

ALTER TABLE executive_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_career_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_public_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_interaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_demo_persona_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_executive_profiles" ON executive_profiles;
CREATE POLICY "service_role_all_executive_profiles" ON executive_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_executive_career_history" ON executive_career_history;
CREATE POLICY "service_role_all_executive_career_history" ON executive_career_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_executive_public_statements" ON executive_public_statements;
CREATE POLICY "service_role_all_executive_public_statements" ON executive_public_statements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_executive_relationships" ON executive_relationships;
CREATE POLICY "service_role_all_executive_relationships" ON executive_relationships
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_executive_interaction_log" ON executive_interaction_log;
CREATE POLICY "service_role_all_executive_interaction_log" ON executive_interaction_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_executive_demo_persona_overrides" ON executive_demo_persona_overrides;
CREATE POLICY "service_role_all_executive_demo_persona_overrides" ON executive_demo_persona_overrides
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
