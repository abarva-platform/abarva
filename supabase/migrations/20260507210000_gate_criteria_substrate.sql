-- F-M1-204 · Gate criteria per-criterion state substrate
--
-- Extends the current gate approval model (source_event_approvals records
-- approval at the gate/action level) with per-criterion state. Each gate
-- has multiple criteria; each criterion can be individually met/not_met/waived/deferred.
--
-- Design decisions:
--   - gate_criteria: definition table — one row per (program, stage, criterion)
--     No FK constraint on program_id to keep loose coupling (engagements schema
--     is in an earlier migration; circular FK risk is non-zero on re-apply).
--   - gate_criterion_states: state machine — one row per criterion, updated in
--     place by reviewers. updated_at is auto-touched via trigger.
--   - RLS: service_role bypass + authenticated read via EXISTS subquery joining
--     through engagements.client_id → can_read_tenant_by_id.
--   - Write (INSERT/UPDATE on gate_criterion_states): is_program_initiator()
--     within tenant. Gate criteria definitions are server-managed only (no
--     authenticated write on gate_criteria).
--
-- PREREQUISITE: 20260507100000_rls_role_helpers.sql must be applied first
-- (adds can_read_tenant_by_id, is_program_initiator helpers).

BEGIN;

-- ── gate_criteria: per-program, per-stage criterion definitions ───────────
CREATE TABLE IF NOT EXISTS gate_criteria (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID    NOT NULL,   -- references engagements(id); loose FK for schema flexibility
  stage_key     TEXT    NOT NULL,
  criterion_id  TEXT    NOT NULL,   -- e.g. 'vendor-landscape-segmented'
  title         TEXT    NOT NULL,
  description   TEXT,
  severity      TEXT    NOT NULL CHECK (severity IN ('hard', 'soft', 'informational')),
  required      BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, stage_key, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_gate_criteria_program_stage
  ON gate_criteria (program_id, stage_key);

-- ── gate_criterion_states: mutable state per criterion ────────────────────
CREATE TABLE IF NOT EXISTS gate_criterion_states (
  id                     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_criteria_id       UUID    NOT NULL REFERENCES gate_criteria(id) ON DELETE CASCADE,
  state                  TEXT    NOT NULL CHECK (state IN ('pending', 'met', 'not_met', 'waived', 'deferred')),
  reviewer_user_id       TEXT,
  reviewed_at            TIMESTAMPTZ,
  notes                  TEXT,
  evidence_artifact_ids  JSONB   NOT NULL DEFAULT '[]',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gate_criterion_states_criteria
  ON gate_criterion_states (gate_criteria_id);

-- ── Auto-touch updated_at on gate_criterion_states ────────────────────────
CREATE OR REPLACE FUNCTION update_gate_criterion_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gate_criterion_states_updated_at_trigger ON gate_criterion_states;
CREATE TRIGGER gate_criterion_states_updated_at_trigger
  BEFORE UPDATE ON gate_criterion_states
  FOR EACH ROW EXECUTE FUNCTION update_gate_criterion_states_updated_at();

-- ── RLS · gate_criteria ───────────────────────────────────────────────────
-- Read: user can read criteria for programs they have access to.
-- Tenant resolution: gate_criteria.program_id → engagements.client_id → can_read_tenant_by_id.
-- Write: gate_criteria rows are server-managed (service_role only); no authenticated write.

ALTER TABLE gate_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_gate_criteria" ON gate_criteria;
CREATE POLICY "service_role_all_gate_criteria" ON gate_criteria
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_gate_criteria" ON gate_criteria;
CREATE POLICY "authenticated_read_gate_criteria" ON gate_criteria
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = gate_criteria.program_id
        AND can_read_tenant_by_id(e.client_id)
    )
  );

-- Authenticated writes on gate_criteria are blocked; server-side only.
DROP POLICY IF EXISTS "block_authenticated_write_gate_criteria" ON gate_criteria;
CREATE POLICY "block_authenticated_write_gate_criteria" ON gate_criteria
  FOR INSERT TO authenticated
  WITH CHECK (false);

GRANT SELECT ON gate_criteria TO authenticated;


-- ── RLS · gate_criterion_states ───────────────────────────────────────────
-- Read: accessible to users who can see the parent program (same join path).
-- Write: is_program_initiator() can INSERT/UPDATE within their tenant.
-- Delete: blocked (immutable audit trail per criterion; use state = 'pending' to reset).

ALTER TABLE gate_criterion_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_gate_criterion_states" ON gate_criterion_states;
CREATE POLICY "service_role_all_gate_criterion_states" ON gate_criterion_states
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_gate_criterion_states" ON gate_criterion_states;
CREATE POLICY "authenticated_read_gate_criterion_states" ON gate_criterion_states
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gate_criteria gc
      JOIN engagements e ON e.id = gc.program_id
      WHERE gc.id = gate_criterion_states.gate_criteria_id
        AND can_read_tenant_by_id(e.client_id)
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_gate_criterion_states" ON gate_criterion_states;
CREATE POLICY "authenticated_insert_gate_criterion_states" ON gate_criterion_states
  FOR INSERT TO authenticated
  WITH CHECK (
    is_program_initiator()
    AND EXISTS (
      SELECT 1 FROM gate_criteria gc
      JOIN engagements e ON e.id = gc.program_id
      WHERE gc.id = gate_criterion_states.gate_criteria_id
        AND can_read_tenant_by_id(e.client_id)
    )
  );

DROP POLICY IF EXISTS "authenticated_update_gate_criterion_states" ON gate_criterion_states;
CREATE POLICY "authenticated_update_gate_criterion_states" ON gate_criterion_states
  FOR UPDATE TO authenticated
  USING (
    is_program_initiator()
    AND EXISTS (
      SELECT 1 FROM gate_criteria gc
      JOIN engagements e ON e.id = gc.program_id
      WHERE gc.id = gate_criterion_states.gate_criteria_id
        AND can_read_tenant_by_id(e.client_id)
    )
  )
  WITH CHECK (
    is_program_initiator()
    AND EXISTS (
      SELECT 1 FROM gate_criteria gc
      JOIN engagements e ON e.id = gc.program_id
      WHERE gc.id = gate_criterion_states.gate_criteria_id
        AND can_read_tenant_by_id(e.client_id)
    )
  );

DROP POLICY IF EXISTS "block_delete_gate_criterion_states" ON gate_criterion_states;
CREATE POLICY "block_delete_gate_criterion_states" ON gate_criterion_states
  FOR DELETE TO authenticated
  USING (false);

GRANT SELECT, INSERT, UPDATE ON gate_criterion_states TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
