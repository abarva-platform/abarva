-- AbarVa — Technology Modernization Engagement Engine
-- Migration 004: tech_engagement_tracks, system_dispositions,
--               erp_selection_results, cloud_blueprints

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Track selection per engagement
CREATE TABLE IF NOT EXISTS tech_engagement_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  track TEXT NOT NULL,
  -- 'core_system' | 'erp' | 'cloud_advisory' | 'all'
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  selected_by TEXT,
  rationale TEXT,
  UNIQUE(engagement_id, track)
);

-- System disposition decisions (Track 1 — Core System Modernization)
CREATE TABLE IF NOT EXISTS system_dispositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  decision TEXT NOT NULL,
  -- 'replace' | 'wrap' | 'optimise' | 'stay' | 'decommission'
  evidence TEXT,
  vendor_recommended TEXT,
  vendor_genome_score INT,
  migration_complexity INT,  -- 0-100
  estimated_cost_m DECIMAL,
  wave INT DEFAULT 1,
  rationale TEXT,
  maestro_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, system_name)
);

-- ERP selection results (Track 2 — ERP Selection & SI Governance)
CREATE TABLE IF NOT EXISTS erp_selection_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  readiness_score INT,       -- 0-100
  readiness_verdict TEXT,    -- 'ready' | 'conditional' | 'not_ready'
  recommended_erp TEXT,
  erp_genome_score INT,
  recommended_si TEXT,
  si_genome_score INT,
  implementation_approach TEXT,  -- 'big_bang' | 'phased' | 'two_tier'
  estimated_total_cost_m DECIMAL,
  estimated_months INT,
  contingency_pct DECIMAL,
  rationale TEXT,
  board_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud architecture blueprints (Track 3 — Cloud Architecture Advisory)
CREATE TABLE IF NOT EXISTS cloud_blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,
  pattern TEXT NOT NULL,
  cloud_provider TEXT,       -- 'aws' | 'azure' | 'gcp'
  key_services TEXT[],
  estimated_build_cost_m DECIMAL,
  estimated_run_cost_m DECIMAL,
  recommended_si TEXT,
  si_genome_score INT,
  blueprint_content JSONB,
  maestro_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: read access for authenticated users
ALTER TABLE tech_engagement_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_dispositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_selection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tech_tracks_read" ON tech_engagement_tracks;
DROP POLICY IF EXISTS "system_dispositions_read" ON system_dispositions;
DROP POLICY IF EXISTS "erp_selection_read" ON erp_selection_results;
DROP POLICY IF EXISTS "cloud_blueprints_read" ON cloud_blueprints;

CREATE POLICY "tech_tracks_read" ON tech_engagement_tracks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_dispositions_read" ON system_dispositions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "erp_selection_read" ON erp_selection_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cloud_blueprints_read" ON cloud_blueprints
  FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tech_tracks_engagement ON tech_engagement_tracks(engagement_id);
CREATE INDEX IF NOT EXISTS idx_system_dispositions_engagement ON system_dispositions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_erp_selection_engagement ON erp_selection_results(engagement_id);
CREATE INDEX IF NOT EXISTS idx_cloud_blueprints_engagement ON cloud_blueprints(engagement_id);
