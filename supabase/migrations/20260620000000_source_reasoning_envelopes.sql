-- source_reasoning_envelopes — durable audit table for Source reasoning-spine outputs
--
-- Each row captures one validated ReasoningEnvelope produced by the generate route
-- (flag `source_reasoning_spine`, Phase 1 Slice 1.8). The envelope is also stored as
-- JSON in source_event_artifact_states.body_generation_metadata.reasoningEnvelope; this
-- table makes it independently queryable, tenant-scoped, and RLS-gated.
--
-- Status values mirror CaptureStatus:
--   "ok"           — claims grounded on usable evidence
--   "refusal"      — spine ran; no gate-defining claim rests on usable evidence
--   "gate_failed"  — envelope failed internal validation gate (envelope col is null)
--   "error"        — unexpected exception (envelope col is null)
--   "disabled"     — flag was OFF (rows are not inserted for this status)
--
-- The "disabled" status is never persisted — rows only exist when the flag was ON.
-- "gate_failed" / "error" rows may be inserted (with null envelope) for observability.
--
-- RLS mirrors the source_event_artifact_states pattern: service_role full, authenticated
-- read/write scoped to can_read_tenant_by_key(tenant_key).
--
-- PREREQUISITE: 20260507230000_source_canvas_per_event_substrate.sql (source_events,
-- can_read_tenant_by_key helper).

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS source_reasoning_envelopes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable id from inside the envelope (ReasoningEnvelope.envelopeId).
  -- One envelope per generate call; UNIQUE enforces that.
  envelope_id         UUID NOT NULL,
  source_event_id     UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  artifact_code       TEXT NOT NULL,
  tenant_key          TEXT NOT NULL,
  stage               TEXT NOT NULL,
  -- CaptureStatus value: "ok" | "refusal" | "gate_failed" | "error"
  status              TEXT NOT NULL
                      CHECK (status IN ('ok', 'refusal', 'gate_failed', 'error')),
  -- Extracted fields for easy querying. Null when status is gate_failed/error.
  archetype           TEXT,
  rigor               TEXT,
  confidence_label    TEXT,
  confidence_score    NUMERIC(4,3),
  -- Populated when status="refusal"; null when status="ok".
  refusal_reason      TEXT,
  -- JSONB array: [{requirement TEXT, currentState TEXT}]
  missing_evidence    JSONB,
  -- JSONB array of claim objects (populated when status="ok").
  claims              JSONB,
  -- Full validated envelope for audit lineage. Null only for gate_failed/error.
  envelope            JSONB,
  -- Clerk user id of the user who triggered generation.
  generated_by_user_id TEXT,
  generated_at        TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (envelope_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_source_reasoning_envelopes_event
  ON source_reasoning_envelopes (source_event_id);

CREATE INDEX IF NOT EXISTS idx_source_reasoning_envelopes_tenant
  ON source_reasoning_envelopes (tenant_key);

CREATE INDEX IF NOT EXISTS idx_source_reasoning_envelopes_status
  ON source_reasoning_envelopes (status);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE source_reasoning_envelopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_reasoning_envelopes"
  ON source_reasoning_envelopes;
CREATE POLICY "service_role_all_source_reasoning_envelopes"
  ON source_reasoning_envelopes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_reasoning_envelopes"
  ON source_reasoning_envelopes;
CREATE POLICY "authenticated_read_source_reasoning_envelopes"
  ON source_reasoning_envelopes
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_key(tenant_key) );

DROP POLICY IF EXISTS "authenticated_write_source_reasoning_envelopes"
  ON source_reasoning_envelopes;
CREATE POLICY "authenticated_write_source_reasoning_envelopes"
  ON source_reasoning_envelopes
  FOR INSERT TO authenticated
  WITH CHECK ( can_read_tenant_by_key(tenant_key) );

GRANT SELECT, INSERT ON source_reasoning_envelopes TO authenticated;
