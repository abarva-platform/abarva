-- Migration 013: Engagement state foundation
-- Creates persons, engagements, turns, relationship_notes tables.
-- These become source of truth for entity state.
-- Neo4j nodes mirror via graph_node_id fields.
-- Existing tables client_brief (010), intake_turns (011), engagement_charters (012)
-- are not dropped — superseded but kept for now. Migration 014 will handle data migration + deprecation.
-- RLS: Not enabled. Migration 014 will add Clerk-aware RLS policies.

BEGIN;

-- Reusable updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PERSONS
-- Persistent identity across engagements. Same row reused when
-- Sarah Chen shows up for engagement #2 six months from now.
-- ============================================================
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_node_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT,
  organization TEXT,
  familiarity TEXT NOT NULL DEFAULT 'first_meeting'
    CHECK (familiarity IN ('first_meeting','returning_recent','returning_dormant','frequent_collaborator')),
  communication_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  working_rhythm JSONB NOT NULL DEFAULT '{}'::jsonb,
  personal_threads TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS persons_email_idx ON persons(email);
CREATE INDEX IF NOT EXISTS persons_graph_node_idx ON persons(graph_node_id);

DROP TRIGGER IF EXISTS persons_set_updated_at ON persons;
CREATE TRIGGER persons_set_updated_at BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- ENGAGEMENTS
-- Stateful container that spans Phase 0 through Phase 4.
-- Same row from Day 1 to Month 8.
-- ============================================================
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_node_id TEXT UNIQUE,
  name TEXT NOT NULL,
  industry_code TEXT NOT NULL,
  function_code TEXT NOT NULL,
  objective_code TEXT NOT NULL,
  topic_code TEXT,
  sponsor_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  co_sponsor_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  maestro_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  current_phase SMALLINT NOT NULL DEFAULT 0 CHECK (current_phase BETWEEN 0 AND 4),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','completed','cancelled')),
  charter JSONB,
  gates_passed JSONB NOT NULL DEFAULT '[]'::jsonb,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  sponsor_approvals JSONB NOT NULL DEFAULT '[]'::jsonb,
  baseline_metrics JSONB,
  actual_metrics JSONB,
  outcome_fee_status TEXT CHECK (outcome_fee_status IN ('not_triggered','proposed','approved','paid')),
  outcome_fee_usd NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  phase_0_started_at TIMESTAMPTZ,
  phase_4_completed_at TIMESTAMPTZ
);

-- Backfill columns when engagements was created by an earlier migration
-- with a minimal schema (e.g. migration 002). The CREATE TABLE IF NOT
-- EXISTS above is a no-op in that case, so the columns 013 expects must
-- be added explicitly here. All ADD COLUMN IF NOT EXISTS — no-op on
-- prod where columns already exist. Required for fresh preview branches.
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS graph_node_id TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS industry_code TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS function_code TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS objective_code TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS topic_code TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS sponsor_person_id UUID REFERENCES persons(id) ON DELETE SET NULL;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS co_sponsor_person_id UUID REFERENCES persons(id) ON DELETE SET NULL;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS maestro_person_id UUID REFERENCES persons(id) ON DELETE SET NULL;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS charter JSONB;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS gates_passed JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS decisions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS deliverables JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS sponsor_approvals JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS baseline_metrics JSONB;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS actual_metrics JSONB;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS outcome_fee_status TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS outcome_fee_usd NUMERIC(15,2);
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS phase_0_started_at TIMESTAMPTZ;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS phase_4_completed_at TIMESTAMPTZ;

-- graph_node_id UNIQUE constraint was defined column-level inside the
-- CREATE TABLE above. When the CREATE TABLE is a no-op (table already
-- exists from 002), the constraint is never created and the ON CONFLICT
-- clause below fails. CREATE UNIQUE INDEX IF NOT EXISTS is the
-- idempotent equivalent — works with ON CONFLICT, safe to re-run.
CREATE UNIQUE INDEX IF NOT EXISTS engagements_graph_node_id_key ON engagements(graph_node_id);

CREATE INDEX IF NOT EXISTS engagements_current_phase_idx ON engagements(current_phase);
CREATE INDEX IF NOT EXISTS engagements_sponsor_idx ON engagements(sponsor_person_id);
CREATE INDEX IF NOT EXISTS engagements_maestro_idx ON engagements(maestro_person_id);
CREATE INDEX IF NOT EXISTS engagements_industry_idx ON engagements(industry_code);
CREATE INDEX IF NOT EXISTS engagements_status_idx ON engagements(status);
CREATE INDEX IF NOT EXISTS engagements_graph_node_idx ON engagements(graph_node_id);

DROP TRIGGER IF EXISTS engagements_set_updated_at ON engagements;
CREATE TRIGGER engagements_set_updated_at BEFORE UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TURNS
-- Every message in the engagement conversation. Append-only.
-- retrieved_refs captures what context drove each agent reply.
-- ============================================================
CREATE TABLE IF NOT EXISTS turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  phase SMALLINT NOT NULL CHECK (phase BETWEEN 0 AND 4),
  sender TEXT NOT NULL CHECK (sender IN ('agent','user')),
  text TEXT NOT NULL,
  mode_label TEXT,
  retrieved_refs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS turns_engagement_created_idx ON turns(engagement_id, created_at);
CREATE INDEX IF NOT EXISTS turns_engagement_phase_idx ON turns(engagement_id, phase, created_at);

-- ============================================================
-- RELATIONSHIP_NOTES
-- Silent capture of personal/behavioral cues from user turns.
-- Surfaces naturally in the agent's next opening.
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('personal','style','preference','crisis_pattern')),
  note_text TEXT NOT NULL,
  source_turn_id UUID REFERENCES turns(id) ON DELETE SET NULL,
  source_engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  decay_at TIMESTAMPTZ,
  surfaced_count INTEGER NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS relationship_notes_person_idx ON relationship_notes(person_id);
CREATE INDEX IF NOT EXISTS relationship_notes_category_idx ON relationship_notes(person_id, category);
CREATE INDEX IF NOT EXISTS relationship_notes_active_idx ON relationship_notes(person_id) WHERE decay_at IS NULL;

-- ============================================================
-- SEED: Sarah Chen + Meridian engagement, matching graph_node_ids
-- Mirrors what's already in Neo4j (003_demo_engagements.cypher)
-- ============================================================
INSERT INTO persons (graph_node_id, name, email, role, organization, familiarity)
VALUES ('person_sarah_chen', 'Sarah Chen', 'sarah.chen@meridian-health.com', 'CIO', 'Meridian Health', 'first_meeting')
ON CONFLICT (graph_node_id) DO NOTHING;

INSERT INTO engagements (
  graph_node_id, name, industry_code, function_code, objective_code, topic_code,
  sponsor_person_id, current_phase, status, phase_0_started_at
)
SELECT
  'eng_meridian_analytics_mod',
  'Meridian Analytics Modernization',
  'HEALTHCARE_IDN',
  'MIDDLE_OFFICE',
  'OPTIMISE',
  'analytics_modernization',
  p.id,
  0,
  'active',
  NOW()
FROM persons p WHERE p.graph_node_id = 'person_sarah_chen'
ON CONFLICT (graph_node_id) DO NOTHING;

COMMIT;
