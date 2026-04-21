-- AbarVa Engagement Engine — Database Schema
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/xtbymdryojmvoulaotce/sql

-- Core engagement record
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  solution TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_phase INT DEFAULT 0,
  maestro_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(client_id, solution)
);

-- Phase records — one per phase per engagement
CREATE TABLE IF NOT EXISTS engagement_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT DEFAULT 'locked',
  -- locked | in_progress | awaiting_maestro_review |
  -- published_to_client | awaiting_client_approval |
  -- disputed | refining | approved | complete
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_by_role TEXT,
  dispute_count INT DEFAULT 0,
  UNIQUE(engagement_id, phase_number)
);

-- Workstreams within a phase
CREATE TABLE IF NOT EXISTS phase_workstreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages within a workstream (unlimited)
CREATE TABLE IF NOT EXISTS workstream_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workstream_id UUID REFERENCES phase_workstreams(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  -- 'maestro_ai' | 'maestro' | 'client' | 'system'
  actor_name TEXT,
  actor_id TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- { genome_patterns_surfaced: [], findings_updated: [], files_analysed: [] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_internal BOOLEAN DEFAULT false
);

-- Findings — first class objects
CREATE TABLE IF NOT EXISTS phase_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  workstream_id UUID REFERENCES phase_workstreams(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  source_files TEXT[],
  genome_pattern TEXT,
  genome_rate DECIMAL,
  severity TEXT,
  -- 'critical' | 'high' | 'medium' | 'low' | 'positive'
  status TEXT DEFAULT 'draft',
  -- 'draft' | 'confirmed' | 'disputed' | 'revised' | 'removed'
  is_published BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finding versions — every change tracked
CREATE TABLE IF NOT EXISTS finding_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES phase_findings(id) ON DELETE CASCADE,
  version INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  change_reason TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finding comments — threaded, per finding
CREATE TABLE IF NOT EXISTS finding_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES phase_findings(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase output documents
CREATE TABLE IF NOT EXISTS phase_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL,
  -- 'readiness_scorecard' | 'situation_brief' |
  -- 'solution_design' | 'execution_roadmap' | 'outcome_report'
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'draft',
  -- 'draft' | 'published' | 'approved' | 'superseded'
  pdf_url TEXT,
  published_at TIMESTAMPTZ,
  published_by TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Output document versions
CREATE TABLE IF NOT EXISTS output_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  output_id UUID REFERENCES phase_outputs(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL,
  pdf_url TEXT,
  published_by TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

-- Output comments (client comments on published document)
CREATE TABLE IF NOT EXISTS output_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  output_id UUID REFERENCES phase_outputs(id) ON DELETE CASCADE,
  section TEXT,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase approval audit trail
CREATE TABLE IF NOT EXISTS phase_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES engagement_phases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  -- 'approved' | 'disputed' | 'refined' | 'escalated'
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  comment TEXT,
  output_version INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files uploaded during engagement
CREATE TABLE IF NOT EXISTS engagement_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES engagement_phases(id),
  workstream_id UUID REFERENCES phase_workstreams(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_by_role TEXT NOT NULL,
  analysis_status TEXT DEFAULT 'pending',
  -- 'pending' | 'analysed' | 'failed'
  analysis_result JSONB,
  findings_updated TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genome pattern matches per engagement
CREATE TABLE IF NOT EXISTS genome_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  pattern_code TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  failure_rate DECIMAL,
  evidence TEXT NOT NULL,
  confidence TEXT NOT NULL,
  -- 'confirmed' | 'probable' | 'possible'
  phase_identified INT,
  source_files TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, pattern_code)
);

-- Engagement participants
CREATE TABLE IF NOT EXISTS engagement_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  notify_on TEXT[],
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log — everything that happens
CREATE TABLE IF NOT EXISTS engagement_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES engagement_phases(id),
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 0 readiness scores (one row per dimension)
CREATE TABLE IF NOT EXISTS phase0_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  solution TEXT NOT NULL,
  dimension TEXT NOT NULL,
  score INT NOT NULL,
  evidence TEXT,
  missing_data TEXT,
  what_it_unlocks TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Baseline agreement (Phase 3 — locked, immutable)
CREATE TABLE IF NOT EXISTS engagement_baseline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  baseline_value TEXT NOT NULL,
  baseline_source TEXT NOT NULL,
  measurement_method TEXT NOT NULL,
  target_value TEXT NOT NULL,
  target_date DATE,
  fee_trigger DECIMAL,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  is_locked BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagement_phases_eng ON engagement_phases(engagement_id);
CREATE INDEX IF NOT EXISTS idx_phase_workstreams_phase ON phase_workstreams(phase_id);
CREATE INDEX IF NOT EXISTS idx_workstream_messages_ws ON workstream_messages(workstream_id, created_at);
CREATE INDEX IF NOT EXISTS idx_phase_findings_phase ON phase_findings(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_outputs_phase ON phase_outputs(phase_id);
CREATE INDEX IF NOT EXISTS idx_engagement_activity_eng ON engagement_activity(engagement_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_genome_matches_eng ON genome_matches(engagement_id);

-- Enable RLS
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstream_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE output_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE output_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE genome_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase0_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_baseline ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- Add read policy for authenticated users (service role still bypasses)
-- Idempotency: drop policies before recreating so re-runs don't trip
-- on "already exists".
DROP POLICY IF EXISTS "authenticated_read_engagements" ON engagements;
DROP POLICY IF EXISTS "authenticated_read_phases" ON engagement_phases;
DROP POLICY IF EXISTS "authenticated_read_workstreams" ON phase_workstreams;
DROP POLICY IF EXISTS "authenticated_read_messages" ON workstream_messages;
DROP POLICY IF EXISTS "authenticated_read_findings" ON phase_findings;
DROP POLICY IF EXISTS "authenticated_read_outputs" ON phase_outputs;
DROP POLICY IF EXISTS "authenticated_read_comments" ON output_comments;
DROP POLICY IF EXISTS "authenticated_read_genome" ON genome_matches;
DROP POLICY IF EXISTS "authenticated_read_activity" ON engagement_activity;
DROP POLICY IF EXISTS "authenticated_read_scores" ON phase0_scores;

CREATE POLICY "authenticated_read_engagements" ON engagements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_phases" ON engagement_phases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_workstreams" ON phase_workstreams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_messages" ON workstream_messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_findings" ON phase_findings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_outputs" ON phase_outputs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_comments" ON output_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_genome" ON genome_matches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_activity" ON engagement_activity
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_scores" ON phase0_scores
  FOR SELECT TO authenticated USING (true);
