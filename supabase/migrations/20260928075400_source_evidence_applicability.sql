-- A requirement-specific absence decision is not evidence readiness. Preserve
-- the seven-state evidence ramp and record accountable applicability separately.
ALTER TABLE public.source_event_evidence_states
  ADD COLUMN IF NOT EXISTS applicability_status text NOT NULL DEFAULT 'applicable',
  ADD COLUMN IF NOT EXISTS applicability_reason text,
  ADD COLUMN IF NOT EXISTS applicability_actor_user_id text,
  ADD COLUMN IF NOT EXISTS applicability_decided_at timestamptz;

ALTER TABLE public.source_event_evidence_states
  ADD CONSTRAINT source_event_evidence_applicability_check CHECK (
    (applicability_status = 'applicable' AND (
      applicability_decided_at IS NULL OR (
        length(trim(coalesce(applicability_reason, ''))) >= 24
        AND nullif(trim(applicability_actor_user_id), '') IS NOT NULL
      )
    ))
    OR (
      applicability_status = 'not_applicable'
      AND requirement_id IN ('EVID-SRC-STR-INCUMBENT', 'EVID-SRC-STR-SPEND-BASELINE')
      AND current_state = 'Not Requested'
      AND source_artifact_id IS NULL
      AND length(trim(coalesce(applicability_reason, ''))) >= 24
      AND nullif(trim(applicability_actor_user_id), '') IS NOT NULL
      AND applicability_decided_at IS NOT NULL
    )
  );

CREATE TABLE IF NOT EXISTS public.source_event_evidence_applicability_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_state_id uuid NOT NULL REFERENCES public.source_event_evidence_states(id),
  source_event_id uuid NOT NULL REFERENCES public.source_events(id),
  tenant_key text NOT NULL,
  requirement_id text NOT NULL,
  applicability_status text NOT NULL CHECK (applicability_status IN ('applicable', 'not_applicable')),
  reason text NOT NULL,
  actor_user_id text NOT NULL,
  decided_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_evidence_applicability_audit_event_idx
  ON public.source_event_evidence_applicability_audit(source_event_id, requirement_id, recorded_at);

CREATE OR REPLACE FUNCTION public.audit_source_evidence_applicability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.applicability_status,
    NEW.applicability_reason,
    NEW.applicability_actor_user_id,
    NEW.applicability_decided_at
  ) IS NOT DISTINCT FROM (
    OLD.applicability_status,
    OLD.applicability_reason,
    OLD.applicability_actor_user_id,
    OLD.applicability_decided_at
  ) THEN
    RETURN NEW;
  END IF;
  IF NEW.applicability_decided_at IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.source_event_evidence_applicability_audit (
    evidence_state_id, source_event_id, tenant_key, requirement_id,
    applicability_status, reason, actor_user_id, decided_at
  ) VALUES (
    NEW.id, NEW.source_event_id, NEW.tenant_key, NEW.requirement_id,
    NEW.applicability_status, NEW.applicability_reason,
    NEW.applicability_actor_user_id, NEW.applicability_decided_at
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_evidence_applicability_audit ON public.source_event_evidence_states;
CREATE TRIGGER source_evidence_applicability_audit
  AFTER INSERT OR UPDATE OF applicability_status, applicability_reason,
    applicability_actor_user_id, applicability_decided_at
  ON public.source_event_evidence_states
  FOR EACH ROW EXECUTE FUNCTION public.audit_source_evidence_applicability();

CREATE OR REPLACE FUNCTION public.reject_source_evidence_applicability_audit_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Source evidence applicability audit is append-only';
END;
$$;

DROP TRIGGER IF EXISTS source_evidence_applicability_audit_immutable
  ON public.source_event_evidence_applicability_audit;
CREATE TRIGGER source_evidence_applicability_audit_immutable
  BEFORE UPDATE OR DELETE ON public.source_event_evidence_applicability_audit
  FOR EACH ROW EXECUTE FUNCTION public.reject_source_evidence_applicability_audit_change();

ALTER TABLE public.source_event_evidence_applicability_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.source_event_evidence_applicability_audit FROM PUBLIC, authenticated;
GRANT SELECT ON public.source_event_evidence_applicability_audit TO service_role;
CREATE POLICY source_evidence_applicability_audit_service_read
  ON public.source_event_evidence_applicability_audit
  FOR SELECT TO service_role USING (true);
