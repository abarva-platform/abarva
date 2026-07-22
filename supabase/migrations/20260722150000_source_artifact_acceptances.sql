-- Source artifact acceptances — the explicit, auditable "I am accepting this
-- specific artifact version as authoritative, and here's why" action.
-- SOURCE-SHELL-004: distinct from the stage GATE (source_event_approvals),
-- which records advancing an event through its 11 stages. This table records
-- accepting one artifact as authoritative independent of the stage gate.
-- Append-only: no UPDATE/DELETE path. The current acceptance for an artifact
-- is always the latest row by accepted_at — same "latest wins, decorate
-- don't overwrite" pattern already used by resolveAuthoritativeArtifact() and
-- the approval ledger.
--
-- Tenant scoping is enforced at the application query layer (join on
-- event_id -> source_events.client_key), matching source_event_approvals —
-- not per-row RLS.

CREATE TABLE IF NOT EXISTS source_artifact_acceptances (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id                UUID NOT NULL REFERENCES source_artifacts(id) ON DELETE CASCADE,
  event_id                   UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  stage_key                  TEXT NOT NULL,
  -- Snapshot of deriveSourceArtifactGovernanceStage()'s output at accept
  -- time (src/lib/source/artifact-governance.ts) — an audit-log fact, not a
  -- second live-mutable copy of governance stage.
  artifact_state              TEXT NOT NULL CHECK (artifact_state IN (
                                 'ai_draft', 'human_review', 'approved_for_external_use',
                                 'client_final', 'superseded'
                               )),
  -- The version this acceptance record is attesting to. Equals artifact_id
  -- for this first pass (one acceptance always names its own artifact row);
  -- kept as an explicit named column, not just an alias, so a later
  -- superseding acceptance can reference a different authoritative version
  -- without reinterpreting artifact_id's meaning.
  authoritative_version_id    UUID NOT NULL REFERENCES source_artifacts(id),
  -- Reuses the existing artifactRole concept already computed in the UI
  -- layer (SourceShellFileItem.artifactRole, src/lib/source/source-event-shell-v2.ts)
  -- — now persisted at accept time instead of only computed on the fly.
  artifact_role                TEXT NOT NULL CHECK (artifact_role IN ('authoritative', 'evidence')),
  -- Named content_drift_status (not drift_status) to avoid colliding with
  -- this repo's existing "migration drift" (sha256 drift-checked) terminology
  -- used by the db-migration-lab governed lane.
  content_drift_status         TEXT NOT NULL DEFAULT 'unknown'
                                CHECK (content_drift_status IN ('current', 'stale', 'unknown')),
  gate_precondition_status     TEXT NOT NULL DEFAULT 'not_ready'
                                CHECK (gate_precondition_status IN ('not_ready', 'ready', 'waived')),
  -- Hook for the mandatory Context & Corpus Governance policy (AGENTS.md) —
  -- whether this accepted artifact is eligible to feed
  -- buildValidatedAgentContextBundle. Enforcement in the context pipeline
  -- itself is separate, follow-up work — this column only captures intent.
  downstream_context_policy    TEXT NOT NULL DEFAULT 'restricted'
                                CHECK (downstream_context_policy IN ('include', 'exclude', 'restricted')),
  diff_summary                 TEXT NULL,
  approval_rationale           TEXT NOT NULL,
  accepted_by                  TEXT NOT NULL,
  accepted_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Latest-acceptance-for-artifact lookup (the hot path for the Artifact
-- status panel).
CREATE INDEX IF NOT EXISTS source_artifact_acceptances_artifact_idx
  ON source_artifact_acceptances (artifact_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS source_artifact_acceptances_event_stage_idx
  ON source_artifact_acceptances (event_id, stage_key);

ALTER TABLE source_artifact_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON source_artifact_acceptances;
CREATE POLICY "service_role_full_access" ON source_artifact_acceptances
  USING (true) WITH CHECK (true);
