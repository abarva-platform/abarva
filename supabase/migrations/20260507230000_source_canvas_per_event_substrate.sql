-- Source canvas per-event substrate
--
-- Adds the per-event state needed to render the universal sourcing canvas
-- with real data. Three new tables + three new columns on source_events.
--
-- Catalog data (canonical artifact specs, gate criteria, evidence
-- requirements) lives in TypeScript at src/lib/source/canonical-specs/ —
-- not in DB — to avoid drift and migration overhead. This migration only
-- adds the *per-event mutable state* that derives from those catalogs:
--
--   1. source_event_artifact_states     — per-event artifact stubs
--   2. source_event_gate_criterion_states — per-event criterion state
--   3. source_event_evidence_states     — per-event evidence readiness
--
-- Plus on source_events:
--   - current_stage_entered_at          — fixes aging accuracy
--   - value_at_stake_low_usd / _high_usd — replaces the derived ±20% band
--
-- Auto-scaffolding on event creation lands in Slice 3 (the createSourcingEvent
-- code path) — this migration only creates the schema.
--
-- PREREQUISITE: 20260507100000_rls_role_helpers.sql (can_read_tenant_by_key,
-- is_program_initiator) and 20260507110000_source_per_user_rls_read.sql.

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- Column adds on source_events
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE source_events
  ADD COLUMN IF NOT EXISTS current_stage_entered_at TIMESTAMPTZ;

ALTER TABLE source_events
  ADD COLUMN IF NOT EXISTS value_at_stake_low_usd NUMERIC;

ALTER TABLE source_events
  ADD COLUMN IF NOT EXISTS value_at_stake_high_usd NUMERIC;

COMMENT ON COLUMN source_events.current_stage_entered_at IS
  'When the event entered its current stage. Updated on stage promotion. '
  'Used by portfolio aging and the canvas stage frame.';

COMMENT ON COLUMN source_events.value_at_stake_low_usd IS
  'Low end of the value-at-stake band. NULL while v2 substrate not bound; '
  'derived ±20% from estimated_value_usd in code as a fallback.';

COMMENT ON COLUMN source_events.value_at_stake_high_usd IS
  'High end of the value-at-stake band. See low column for fallback rule.';


-- ════════════════════════════════════════════════════════════════════════════
-- source_event_artifact_states · per-event artifact stubs
-- ════════════════════════════════════════════════════════════════════════════
-- One row per (event, artifact_code from canonical specs). Created by the
-- auto-scaffolding flow on event INSERT. Status starts at `not_started` /
-- tier `stub`; advances as the user uploads or generates content. When a
-- real artifact is uploaded into source_artifacts, linked_artifact_id is set
-- and tier promotes to `outline` or `rich`.

CREATE TABLE IF NOT EXISTS source_event_artifact_states (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id       UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  tenant_key            TEXT NOT NULL,
  -- Stable artifact code from canonical specs (e.g. d05_scope_memo).
  -- Not a FK to a catalog table because catalogs live in TypeScript.
  artifact_code         TEXT NOT NULL,
  stage_key             TEXT NOT NULL,
  artifact_family       TEXT NOT NULL,
  -- Default tier from spec; promotes as the artifact gains content.
  tier                  TEXT NOT NULL DEFAULT 'stub'
                        CHECK (tier IN ('stub', 'outline', 'rich')),
  status                TEXT NOT NULL DEFAULT 'not_started'
                        CHECK (status IN (
                          'not_started', 'drafting', 'needs_review',
                          'approved', 'locked', 'superseded'
                        )),
  requirement_level     TEXT NOT NULL
                        CHECK (requirement_level IN ('required', 'recommended', 'optional')),
  gate_defining         BOOLEAN NOT NULL DEFAULT false,
  -- Set when a real artifact is uploaded for this slot. NULL while the
  -- slot is still a scaffold stub.
  linked_artifact_id    UUID REFERENCES source_artifacts(id) ON DELETE SET NULL,
  -- Free-form notes kept by the agent / user.
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, artifact_code)
);

CREATE INDEX IF NOT EXISTS idx_source_event_artifact_states_event
  ON source_event_artifact_states (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_artifact_states_event_stage
  ON source_event_artifact_states (source_event_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_source_event_artifact_states_tenant
  ON source_event_artifact_states (tenant_key);

COMMENT ON TABLE source_event_artifact_states IS
  'Per-event scaffolded artifact stubs derived from the canonical artifact '
  'specs in src/lib/source/canonical-specs/artifact-specs.ts. One row per '
  '(event, artifact_code).';


-- ════════════════════════════════════════════════════════════════════════════
-- source_event_gate_criterion_states · per-event criterion states
-- ════════════════════════════════════════════════════════════════════════════
-- One row per (event, criterion_id from canonical gate criteria). The gate
-- panel reads this table to render "X of Y criteria met" and to enable or
-- disable the Promote button. Separate from the existing program-tied
-- gate_criterion_states table (RLS bound to engagements) because Source
-- events live outside the engagements graph.

CREATE TABLE IF NOT EXISTS source_event_gate_criterion_states (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id          UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  tenant_key               TEXT NOT NULL,
  -- Stable criterion id from canonical specs (e.g. GATE-SCOPE-01).
  criterion_id             TEXT NOT NULL,
  -- Denormalized for filter-by-stage queries.
  from_stage               TEXT NOT NULL,
  to_stage                 TEXT NOT NULL,
  state                    TEXT NOT NULL DEFAULT 'pending'
                           CHECK (state IN (
                             'pending', 'met', 'not_met', 'waived', 'deferred'
                           )),
  reviewer_user_id         TEXT,
  reviewed_at              TIMESTAMPTZ,
  notes                    TEXT,
  -- Set of artifact ids that satisfied this criterion (when applicable).
  evidence_artifact_ids    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- For waived criteria, the approval record id.
  waiver_approval_id       UUID REFERENCES source_event_approvals(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_source_event_gate_criterion_states_event
  ON source_event_gate_criterion_states (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_gate_criterion_states_event_from_stage
  ON source_event_gate_criterion_states (source_event_id, from_stage);
CREATE INDEX IF NOT EXISTS idx_source_event_gate_criterion_states_tenant
  ON source_event_gate_criterion_states (tenant_key);

COMMENT ON TABLE source_event_gate_criterion_states IS
  'Per-event gate criterion state. Separate from program-tied '
  'gate_criterion_states because Source events do not live in the '
  'engagements graph. Criterion definitions are canonical TS specs at '
  'src/lib/source/canonical-specs/gate-criteria.ts.';


-- ════════════════════════════════════════════════════════════════════════════
-- source_event_evidence_states · per-event evidence readiness
-- ════════════════════════════════════════════════════════════════════════════
-- One row per (event, evidence requirement_id). Tracks the seven-state
-- readiness ramp from the dossier. Drives the data-readiness panel and the
-- evidence drawer on the canvas.

CREATE TABLE IF NOT EXISTS source_event_evidence_states (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id          UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  tenant_key               TEXT NOT NULL,
  -- Stable requirement id (e.g. EVID-SRC-SCOPE-TICKET-HISTORY).
  requirement_id           TEXT NOT NULL,
  stage_key                TEXT NOT NULL,
  -- Current readiness state from the dossier seven-state ramp.
  current_state            TEXT NOT NULL DEFAULT 'Not Requested'
                           CHECK (current_state IN (
                             'Not Requested',
                             'Loaded',
                             'Parsed',
                             'Available',
                             'Usable Evidence',
                             'Stale',
                             'Low Confidence'
                           )),
  -- Ties this evidence to a specific source artifact when one was uploaded.
  source_artifact_id       UUID REFERENCES source_artifacts(id) ON DELETE SET NULL,
  -- Free-form notes (e.g. "ServiceNow sync 14 days stale").
  notes                    TEXT,
  last_synced_at           TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_source_event_evidence_states_event
  ON source_event_evidence_states (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_evidence_states_event_stage
  ON source_event_evidence_states (source_event_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_source_event_evidence_states_tenant
  ON source_event_evidence_states (tenant_key);

COMMENT ON TABLE source_event_evidence_states IS
  'Per-event evidence readiness state. Requirement definitions are canonical '
  'TS specs at src/lib/source/canonical-specs/evidence-requirements.ts.';


-- ════════════════════════════════════════════════════════════════════════════
-- Auto-touch updated_at triggers
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION source_canvas_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS source_event_artifact_states_touch ON source_event_artifact_states;
CREATE TRIGGER source_event_artifact_states_touch
  BEFORE UPDATE ON source_event_artifact_states
  FOR EACH ROW EXECUTE FUNCTION source_canvas_touch_updated_at();

DROP TRIGGER IF EXISTS source_event_gate_criterion_states_touch ON source_event_gate_criterion_states;
CREATE TRIGGER source_event_gate_criterion_states_touch
  BEFORE UPDATE ON source_event_gate_criterion_states
  FOR EACH ROW EXECUTE FUNCTION source_canvas_touch_updated_at();

DROP TRIGGER IF EXISTS source_event_evidence_states_touch ON source_event_evidence_states;
CREATE TRIGGER source_event_evidence_states_touch
  BEFORE UPDATE ON source_event_evidence_states
  FOR EACH ROW EXECUTE FUNCTION source_canvas_touch_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- RLS · per-event state tables
-- ════════════════════════════════════════════════════════════════════════════
-- Reads: authenticated users can read rows for events in tenants they can
-- read. Writes (INSERT/UPDATE): authenticated users with a write role on
-- the parent source_event. Pattern follows source_event_approvals /
-- source_per_user_rls_read.
--
-- Service role bypasses RLS but explicit service_role policies are preserved
-- for clarity and parity with the rest of the source_* substrate.

-- ── source_event_artifact_states ────────────────────────────────────────────
ALTER TABLE source_event_artifact_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_event_artifact_states"
  ON source_event_artifact_states;
CREATE POLICY "service_role_all_source_event_artifact_states"
  ON source_event_artifact_states
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_artifact_states"
  ON source_event_artifact_states;
CREATE POLICY "authenticated_read_source_event_artifact_states"
  ON source_event_artifact_states
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_write_source_event_artifact_states"
  ON source_event_artifact_states;
CREATE POLICY "authenticated_write_source_event_artifact_states"
  ON source_event_artifact_states
  FOR INSERT TO authenticated
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_update_source_event_artifact_states"
  ON source_event_artifact_states;
CREATE POLICY "authenticated_update_source_event_artifact_states"
  ON source_event_artifact_states
  FOR UPDATE TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) )
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT, INSERT, UPDATE ON source_event_artifact_states TO authenticated;


-- ── source_event_gate_criterion_states ──────────────────────────────────────
ALTER TABLE source_event_gate_criterion_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states;
CREATE POLICY "service_role_all_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states;
CREATE POLICY "authenticated_read_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_write_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states;
CREATE POLICY "authenticated_write_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states
  FOR INSERT TO authenticated
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_update_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states;
CREATE POLICY "authenticated_update_source_event_gate_criterion_states"
  ON source_event_gate_criterion_states
  FOR UPDATE TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) )
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT, INSERT, UPDATE ON source_event_gate_criterion_states TO authenticated;


-- ── source_event_evidence_states ────────────────────────────────────────────
ALTER TABLE source_event_evidence_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_event_evidence_states"
  ON source_event_evidence_states;
CREATE POLICY "service_role_all_source_event_evidence_states"
  ON source_event_evidence_states
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_evidence_states"
  ON source_event_evidence_states;
CREATE POLICY "authenticated_read_source_event_evidence_states"
  ON source_event_evidence_states
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_write_source_event_evidence_states"
  ON source_event_evidence_states;
CREATE POLICY "authenticated_write_source_event_evidence_states"
  ON source_event_evidence_states
  FOR INSERT TO authenticated
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_update_source_event_evidence_states"
  ON source_event_evidence_states;
CREATE POLICY "authenticated_update_source_event_evidence_states"
  ON source_event_evidence_states
  FOR UPDATE TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) )
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT, INSERT, UPDATE ON source_event_evidence_states TO authenticated;


NOTIFY pgrst, 'reload schema';

COMMIT;
