-- Source event workflow authority is distinct from the existing Door 1/Door 2
-- sourcing_motion. Legacy events remain active, but no RFI/RFP motion is inferred.

ALTER TABLE public.source_events
  ADD COLUMN IF NOT EXISTS activation_state TEXT NOT NULL DEFAULT 'active_event',
  ADD COLUMN IF NOT EXISTS solicitation_motion TEXT NULL,
  ADD COLUMN IF NOT EXISTS solicitation_motion_accepted_by_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS solicitation_motion_accepted_at TIMESTAMPTZ NULL;

DO $authority$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.source_events'::regclass
      AND conname = 'source_events_activation_state_check'
  ) THEN
    ALTER TABLE public.source_events
      ADD CONSTRAINT source_events_activation_state_check
      CHECK (activation_state IN ('request', 'active_event', 'closed_request'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.source_events'::regclass
      AND conname = 'source_events_solicitation_motion_acceptance_check'
  ) THEN
    ALTER TABLE public.source_events
      ADD CONSTRAINT source_events_solicitation_motion_acceptance_check
      CHECK (
        (solicitation_motion IS NULL
          AND solicitation_motion_accepted_by_user_id IS NULL
          AND solicitation_motion_accepted_at IS NULL)
        OR
        (solicitation_motion IN ('rfi', 'rfp')
          AND NULLIF(BTRIM(solicitation_motion_accepted_by_user_id), '') IS NOT NULL
          AND solicitation_motion_accepted_at IS NOT NULL)
      );
  END IF;
END;
$authority$;

COMMENT ON COLUMN public.source_events.activation_state IS
  'Request versus active-event authority. Existing rows remain active; request activation requires a separately governed transition.';
COMMENT ON COLUMN public.source_events.solicitation_motion IS
  'Accepted RFI or RFP motion, independent of sourcing_motion and current_stage_key. NULL means no accepted motion is recorded.';
