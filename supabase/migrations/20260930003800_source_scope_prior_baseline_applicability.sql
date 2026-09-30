BEGIN;

ALTER TABLE public.source_event_evidence_states
  DROP CONSTRAINT source_event_evidence_applicability_check;

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
      AND requirement_id IN (
        'EVID-SRC-STR-INCUMBENT',
        'EVID-SRC-STR-SPEND-BASELINE',
        'EVID-SRC-SCOPE-FY-CONTRACT'
      )
      AND current_state = 'Not Requested'
      AND source_artifact_id IS NULL
      AND length(trim(coalesce(applicability_reason, ''))) >= 24
      AND nullif(trim(applicability_actor_user_id), '') IS NOT NULL
      AND applicability_decided_at IS NOT NULL
    )
  );

COMMIT;
