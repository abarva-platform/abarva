-- Add explicit package artifact pointers to Moves review decisions.
-- Existing decisions remain valid; new decisions can cite both the visual
-- companion and editable Word-equivalent artifact that formed the review pack.

BEGIN;

ALTER TABLE public.move_artifact_review_decisions
  ADD COLUMN IF NOT EXISTS html_visual_companion_artifact_id UUID
    REFERENCES public.move_artifacts(artifact_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS docx_editable_artifact_id UUID
    REFERENCES public.move_artifacts(artifact_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_artifact_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS move_artifact_review_decisions_html_companion_idx
  ON public.move_artifact_review_decisions
  (tenant_key, html_visual_companion_artifact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS move_artifact_review_decisions_docx_editable_idx
  ON public.move_artifact_review_decisions
  (tenant_key, docx_editable_artifact_id, created_at DESC);

COMMENT ON COLUMN public.move_artifact_review_decisions.html_visual_companion_artifact_id IS
  'HTML visual review companion artifact included in the reviewed phase package.';

COMMENT ON COLUMN public.move_artifact_review_decisions.docx_editable_artifact_id IS
  'DOCX editable Word-equivalent artifact included in the reviewed phase package.';

COMMENT ON COLUMN public.move_artifact_review_decisions.reviewed_artifact_ids IS
  'All Move artifact ids that formed the human review package for this decision.';

COMMIT;
