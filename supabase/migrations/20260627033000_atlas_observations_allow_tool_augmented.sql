-- Tower/aVa route contract alignment.
--
-- `atlas_message_traces.route_type` has allowed `tool_augmented` since
-- 20260421152100, and the TypeScript AtlasRouteType includes it. The
-- observations table kept the older check constraint, so deterministic
-- tool-backed Tower answers could be assembled successfully and then fail
-- while persisting the observation. That surfaced in the UI as the generic
-- "could not answer" fallback.

ALTER TABLE atlas_observations
  DROP CONSTRAINT IF EXISTS atlas_observations_route_type_check;

ALTER TABLE atlas_observations
  ADD CONSTRAINT atlas_observations_route_type_check
  CHECK (route_type IN ('scripted', 'llm', 'hybrid', 'tool_augmented', 'rule'));
