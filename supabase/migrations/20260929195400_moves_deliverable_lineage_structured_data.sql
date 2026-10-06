-- Store generated-artifact approval lineage on the authoritative deliverable row.
-- Nullable and additive: existing deliverables remain unchanged until approved.

BEGIN;

ALTER TABLE public.deliverables_v2
  ADD COLUMN IF NOT EXISTS structured_data JSONB;

COMMENT ON COLUMN public.deliverables_v2.structured_data IS
  'Governed structured metadata for the deliverable, including verified generated-artifact acceptance lineage and evidence revision when present.';

COMMIT;
