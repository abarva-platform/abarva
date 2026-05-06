-- Phase 2 · Generalize Atlas-specific persistence into a four-agent model.
--
-- The original atlas_threads and atlas_observations tables capture Tower's
-- Atlas conversational state. Under the front-agent-per-product model
-- (memory: feedback_workflow_first_agents_hidden.md), every front agent
-- (Nexus, Sentinel, Steward, Atlas) deserves the same persistence shape.
--
-- This migration is additive and non-breaking:
--   1. Adds `agent_name` column to atlas_threads + atlas_observations
--      (defaulting to 'atlas' so existing rows are preserved correctly).
--   2. Creates `agent_threads` and `agent_observations` views that expose
--      the Atlas tables under a generalized name. Existing Atlas code keeps
--      using the original tables; new code can target the views.
--   3. Future agents (nexus, sentinel, steward) write to the same atlas_*
--      tables with their own agent_name value. A follow-up wave can rename
--      atlas_* → agent_* once all consumers are switched.

BEGIN;

-- ── Atlas_threads: add agent_name discriminator ──────────────────────────────

ALTER TABLE atlas_threads
  ADD COLUMN IF NOT EXISTS agent_name TEXT NOT NULL DEFAULT 'atlas';

ALTER TABLE atlas_threads
  DROP CONSTRAINT IF EXISTS atlas_threads_agent_name_check;
ALTER TABLE atlas_threads
  ADD CONSTRAINT atlas_threads_agent_name_check
    CHECK (agent_name IN ('atlas', 'nexus', 'sentinel', 'steward'));

CREATE INDEX IF NOT EXISTS idx_atlas_threads_agent_name
  ON atlas_threads (agent_name);

-- ── Atlas_observations: add agent_name discriminator ─────────────────────────

ALTER TABLE atlas_observations
  ADD COLUMN IF NOT EXISTS agent_name TEXT NOT NULL DEFAULT 'atlas';

ALTER TABLE atlas_observations
  DROP CONSTRAINT IF EXISTS atlas_observations_agent_name_check;
ALTER TABLE atlas_observations
  ADD CONSTRAINT atlas_observations_agent_name_check
    CHECK (agent_name IN ('atlas', 'nexus', 'sentinel', 'steward'));

CREATE INDEX IF NOT EXISTS idx_atlas_observations_agent_name
  ON atlas_observations (agent_name);

-- ── Generalized views (additive; no impact on existing code) ─────────────────

CREATE OR REPLACE VIEW agent_threads AS
  SELECT * FROM atlas_threads;

COMMENT ON VIEW agent_threads IS
  'Generalized agent thread view. Backed by atlas_threads with agent_name discriminator. '
  'Phase 2 of the front-agent-per-product architecture rollout (2026-05-06).';

CREATE OR REPLACE VIEW agent_observations AS
  SELECT * FROM atlas_observations;

COMMENT ON VIEW agent_observations IS
  'Generalized agent observation view. Backed by atlas_observations with agent_name discriminator. '
  'Phase 2 of the front-agent-per-product architecture rollout (2026-05-06).';

-- ── RLS on views (inherits from base tables; explicit grant for clarity) ─────

GRANT SELECT ON agent_threads TO service_role;
GRANT SELECT ON agent_observations TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
