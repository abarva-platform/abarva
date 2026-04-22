-- Restore engagements.solution + is_demo_data columns.
--
-- These existed on migration 002 but were dropped out-of-band on prod.
-- Missing columns surfaced in two places:
--   1 · Fresh preview branches · 013's demo seed failed on solution NOT NULL
--       (fixed defensively in 013 by dropping the NOT NULL, which landed
--       before this migration — see 013 DO block).
--   2 · Programs seed script · tried to insert is_demo_data=true and got
--       a schema-cache miss. Seed was patched to omit the column.
--
-- This migration restores both columns with sensible defaults so:
--   - Future code can rely on is_demo_data to filter demo rows from
--     production analytics and rollups
--   - solution is available as a nullable tag for any code that still
--     references it (nothing does at the moment, but cleaner than gone)
--
-- Safe to re-run · all statements use IF NOT EXISTS.

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS solution TEXT;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;

-- Index for the common "exclude demo data" analytics filter
CREATE INDEX IF NOT EXISTS idx_engagements_is_demo_data
  ON engagements(is_demo_data) WHERE is_demo_data = true;

-- Backfill the 4 Apex demo programs + existing Meridian/First Capital demos
UPDATE engagements SET is_demo_data = true
WHERE id IN (
  SELECT id FROM engagements
  WHERE name IN (
    'Contact Center AI Transformation',
    'Unified Customer Data Platform',
    'Store Associate Productivity',
    'Demand Forecasting AI',
    'Meridian Analytics Modernization'
  )
);

NOTIFY pgrst, 'reload schema';
