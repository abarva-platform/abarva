-- Deliverable runs - context coverage instrumentation.
--
-- Additive JSONB telemetry for the governed evidence packing readout. The existing
-- retrieved_evidence scalar remains for backward-compatible polling and readiness
-- checks; this object carries the richer available/retrieved/packed/dropped/cited
-- counts needed to prove prompt context coverage.

ALTER TABLE deliverable_runs
  ADD COLUMN IF NOT EXISTS context_coverage JSONB NULL;
