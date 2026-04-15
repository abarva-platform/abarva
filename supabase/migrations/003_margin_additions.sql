-- AbarVa — Margin Opportunity Map + Dynamic Data Request Generator
-- Migration 003: adds engagement_scope, data_requests, margin_opportunity_status

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Scope selections per engagement
CREATE TABLE IF NOT EXISTS engagement_scope (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  focus_area TEXT NOT NULL,
  -- 'revenue_rcm' | 'back_office_finance' | 'supply_chain' | 'workforce' |
  -- 'it_ops' | 'clinical_ops' | 'ai_portfolio' | 'middle_office' |
  -- 'fee_yield' | 'client_retention' | 'it_cost'
  selected_by TEXT,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  rationale TEXT,
  UNIQUE(engagement_id, focus_area)
);

-- Data requests generated for each scope area
CREATE TABLE IF NOT EXISTS data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  focus_area TEXT NOT NULL,
  file_requested TEXT NOT NULL,
  why_needed TEXT NOT NULL,
  what_it_unlocks TEXT NOT NULL,
  three_number_alternative TEXT,
  priority TEXT DEFAULT 'high',
  -- 'high' | 'medium' | 'optional'
  status TEXT DEFAULT 'pending',
  -- 'pending' | 'uploaded' | 'numbers_entered' | 'skipped'
  response_file_url TEXT,
  response_numbers JSONB,
  responded_by TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Margin opportunity map status per engagement
CREATE TABLE IF NOT EXISTS margin_opportunity_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  lever_id TEXT NOT NULL,
  lever_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  -- 'analysed' | 'genome_estimate' | 'unlock_required'
  opportunity_min_m DECIMAL,
  opportunity_max_m DECIMAL,
  genome_confidence DECIMAL,
  key_finding TEXT,
  data_required TEXT[],
  wave INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, lever_id)
);

-- RLS: read access for authenticated users
ALTER TABLE engagement_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_opportunity_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engagement_scope_read" ON engagement_scope
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "data_requests_read" ON data_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "margin_opportunity_status_read" ON margin_opportunity_status
  FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_engagement_scope_engagement ON engagement_scope(engagement_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_engagement ON data_requests(engagement_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS idx_margin_opportunity_status_engagement ON margin_opportunity_status(engagement_id);
