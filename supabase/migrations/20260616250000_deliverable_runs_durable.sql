-- Deliverable runs — durable claim/lease queue for crash-safe generation.
--
-- Board-grade generation is a six-pass Claude flow (~5–10 min). It previously ran as a
-- detached `void (async…)` promise inside the POST handler. On Azure Container Apps the
-- web replica (minReplicas:0/maxReplicas:1) is recycled shortly after the 202 returns,
-- which kills the orphaned promise mid-run and leaves the run stuck at 'running' forever.
--
-- This migration turns deliverable_runs into a durable work queue. The route now only
-- enqueues a row (status='queued') carrying the FULL job payload needed to run the
-- generation from the row alone. A separate ACA Job (the worker) atomically claims the
-- next queued row (FOR UPDATE SKIP LOCKED), runs the generation deterministically from
-- the persisted payload, heartbeats while alive, and completes the row. A stale claim
-- (worker died) is reclaimable after a lease deadline.
--
-- Additive + nullable so in-flight rows are unaffected.

BEGIN;

-- 1 · allow the new 'queued' entry state alongside the existing terminal/active states.
ALTER TABLE deliverable_runs
  DROP CONSTRAINT IF EXISTS deliverable_runs_status_check;
ALTER TABLE deliverable_runs
  ADD CONSTRAINT deliverable_runs_status_check
    CHECK (status IN ('queued', 'running', 'succeeded', 'blocked', 'failed'));

-- 2 · claim/lease bookkeeping + the self-contained job payload.
ALTER TABLE deliverable_runs
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS worker_id  TEXT NULL,
  -- Full GenerateDeliverableServiceInput-shaped payload (module, useCaseArchetype,
  -- deliverableType, audience, decisionContext, clientDisplayName, initiativeDisplayName,
  -- sourceArtifactRef, evidenceQuery, outputFormats, model). clientId/tenantKey/userId are
  -- already first-class columns; the worker reconstructs the run input from both.
  ADD COLUMN IF NOT EXISTS job_payload JSONB NULL;

-- 3 · claim index: the worker scans for the oldest 'queued' (or stale 'running') row.
CREATE INDEX IF NOT EXISTS idx_deliverable_runs_claim
  ON deliverable_runs (status, claimed_at);

COMMIT;
