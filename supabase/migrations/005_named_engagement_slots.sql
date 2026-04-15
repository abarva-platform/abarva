-- AbarVa — Named Engagement Slots
-- Migration 005: allow multiple engagements per client×solution
-- Each can be named ("Arcturus Full Demo", "Meridian Pilot", etc.)
-- Only one is "active" at a time — others are archived but preserved

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add name and active flag
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS engagement_name TEXT DEFAULT 'Default';
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop the old UNIQUE constraint that allowed only one per client×solution
ALTER TABLE engagements DROP CONSTRAINT IF EXISTS engagements_client_id_solution_key;

-- Partial unique index: only one ACTIVE engagement per client×solution at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_engagements_one_active
  ON engagements(client_id, solution)
  WHERE is_active = true;

-- Name existing rows sensibly
UPDATE engagements
  SET engagement_name = initcap(client_id) || ' × ' || initcap(solution) || ' — v1'
  WHERE engagement_name IS NULL OR engagement_name = 'Default';
