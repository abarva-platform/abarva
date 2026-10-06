-- Tenant- and event-bound evaluation authority. This migration is authored only;
-- applying it requires a separate governed database operation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS source_scorecard_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  client_key TEXT NOT NULL,
  criterion_id TEXT NOT NULL,
  criterion_version TEXT NOT NULL,
  label TEXT NOT NULL,
  weight NUMERIC(12, 4) NOT NULL,
  weights_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  approved_criterion_version TEXT NULL,
  approved_by TEXT NULL,
  approved_at TIMESTAMPTZ NULL,
  superseded_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_scorecard_criteria_event_fk
    FOREIGN KEY (event_id, client_key) REFERENCES source_events(id, client_key),
  CONSTRAINT source_scorecard_criteria_version_key
    UNIQUE (event_id, client_key, criterion_id, criterion_version),
  CONSTRAINT source_scorecard_criteria_identity_check CHECK (
    NULLIF(BTRIM(criterion_id), '') IS NOT NULL AND
    NULLIF(BTRIM(criterion_version), '') IS NOT NULL AND
    NULLIF(BTRIM(label), '') IS NOT NULL
  ),
  CONSTRAINT source_scorecard_criteria_weight_check CHECK (weight > 0),
  CONSTRAINT source_scorecard_criteria_approval_check CHECK (
    (approved_criterion_version IS NULL AND approved_by IS NULL AND approved_at IS NULL)
    OR
    (approved_criterion_version IS NOT NULL
      AND approved_criterion_version = criterion_version AND weights_frozen
      AND NULLIF(BTRIM(approved_by), '') IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS source_scorecard_criteria_one_current_idx
  ON source_scorecard_criteria(event_id, criterion_id)
  WHERE superseded_at IS NULL;

CREATE TABLE IF NOT EXISTS source_scorecard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  client_key TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  criterion_id TEXT NOT NULL,
  criterion_version TEXT NOT NULL,
  evaluator_id TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  evaluator_score NUMERIC(12, 4) NULL,
  evidence_reference TEXT NULL,
  override_reason TEXT NULL,
  override_reason_required BOOLEAN NOT NULL DEFAULT FALSE,
  lock_state TEXT NOT NULL DEFAULT 'unlocked',
  locked_by TEXT NULL,
  locked_at TIMESTAMPTZ NULL,
  superseded_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_scorecard_scores_event_fk
    FOREIGN KEY (event_id, client_key) REFERENCES source_events(id, client_key),
  CONSTRAINT source_scorecard_scores_criterion_fk
    FOREIGN KEY (event_id, client_key, criterion_id, criterion_version)
    REFERENCES source_scorecard_criteria(event_id, client_key, criterion_id, criterion_version),
  CONSTRAINT source_scorecard_scores_identity_check CHECK (
    NULLIF(BTRIM(vendor_id), '') IS NOT NULL AND
    NULLIF(BTRIM(vendor_name), '') IS NOT NULL AND
    NULLIF(BTRIM(evaluator_id), '') IS NOT NULL AND
    NULLIF(BTRIM(evaluator_name), '') IS NOT NULL
  ),
  CONSTRAINT source_scorecard_scores_lock_state_check
    CHECK (lock_state IN ('locked', 'unlocked')),
  CONSTRAINT source_scorecard_scores_locked_proof_check CHECK (
    (lock_state = 'unlocked' AND locked_by IS NULL AND locked_at IS NULL)
    OR
    (lock_state = 'locked' AND evaluator_score IS NOT NULL
      AND NULLIF(BTRIM(evidence_reference), '') IS NOT NULL
      AND NULLIF(BTRIM(locked_by), '') IS NOT NULL AND locked_at IS NOT NULL
      AND (NOT override_reason_required OR NULLIF(BTRIM(override_reason), '') IS NOT NULL))
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS source_scorecard_scores_one_current_idx
  ON source_scorecard_scores(event_id, vendor_id, criterion_id, evaluator_id)
  WHERE superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS source_scorecard_criteria_tenant_event_idx
  ON source_scorecard_criteria(client_key, event_id);
CREATE INDEX IF NOT EXISTS source_scorecard_scores_tenant_event_idx
  ON source_scorecard_scores(client_key, event_id);

CREATE OR REPLACE FUNCTION prevent_locked_source_scorecard_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'source_scorecard_criteria' THEN
    IF OLD.approved_at IS NOT NULL AND
      (NEW.event_id, NEW.client_key, NEW.criterion_id, NEW.criterion_version,
       NEW.label, NEW.weight, NEW.weights_frozen, NEW.approved_criterion_version,
       NEW.approved_by, NEW.approved_at)
      IS DISTINCT FROM
      (OLD.event_id, OLD.client_key, OLD.criterion_id, OLD.criterion_version,
       OLD.label, OLD.weight, OLD.weights_frozen, OLD.approved_criterion_version,
       OLD.approved_by, OLD.approved_at)
    THEN
      RAISE EXCEPTION 'approved scorecard criteria are immutable; create a new version';
    END IF;
  ELSIF OLD.lock_state = 'locked' AND
    (NEW.event_id, NEW.client_key, NEW.vendor_id, NEW.vendor_name,
     NEW.criterion_id, NEW.criterion_version, NEW.evaluator_id,
     NEW.evaluator_name, NEW.evaluator_score, NEW.evidence_reference,
     NEW.override_reason, NEW.override_reason_required, NEW.lock_state,
     NEW.locked_by, NEW.locked_at)
    IS DISTINCT FROM
    (OLD.event_id, OLD.client_key, OLD.vendor_id, OLD.vendor_name,
     OLD.criterion_id, OLD.criterion_version, OLD.evaluator_id,
     OLD.evaluator_name, OLD.evaluator_score, OLD.evidence_reference,
     OLD.override_reason, OLD.override_reason_required, OLD.lock_state,
     OLD.locked_by, OLD.locked_at)
  THEN
    RAISE EXCEPTION 'locked scorecard scores are immutable; create a new record';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_scorecard_criteria_immutable_trigger ON source_scorecard_criteria;
CREATE TRIGGER source_scorecard_criteria_immutable_trigger
  BEFORE UPDATE ON source_scorecard_criteria
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_source_scorecard_change();

DROP TRIGGER IF EXISTS source_scorecard_scores_immutable_trigger ON source_scorecard_scores;
CREATE TRIGGER source_scorecard_scores_immutable_trigger
  BEFORE UPDATE ON source_scorecard_scores
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_source_scorecard_change();

ALTER TABLE source_scorecard_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_scorecard_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS source_scorecard_criteria_service_role ON source_scorecard_criteria;
CREATE POLICY source_scorecard_criteria_service_role ON source_scorecard_criteria
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS source_scorecard_scores_service_role ON source_scorecard_scores;
CREATE POLICY source_scorecard_scores_service_role ON source_scorecard_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS source_scorecard_criteria_tenant_read ON source_scorecard_criteria;
CREATE POLICY source_scorecard_criteria_tenant_read ON source_scorecard_criteria
  FOR SELECT TO authenticated USING (can_read_tenant_by_key(client_key));
DROP POLICY IF EXISTS source_scorecard_scores_tenant_read ON source_scorecard_scores;
CREATE POLICY source_scorecard_scores_tenant_read ON source_scorecard_scores
  FOR SELECT TO authenticated USING (can_read_tenant_by_key(client_key));
