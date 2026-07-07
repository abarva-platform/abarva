-- Moves sponsor-review decisions for premium phase artifacts.
-- This is intentionally separate from move_artifacts.metadata so review
-- outcomes remain auditable and can drive next-phase draft readiness without
-- implying final phase approval.

BEGIN;

CREATE TABLE IF NOT EXISTS public.move_artifact_review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  move_id UUID NOT NULL,
  phase INT NOT NULL,
  artifact_id UUID NOT NULL REFERENCES public.move_artifacts(artifact_id) ON DELETE CASCADE,
  artifact_version INT NOT NULL,
  reviewer_user_id TEXT,
  reviewer_email TEXT,
  decision TEXT NOT NULL CHECK (decision IN (
    'approve_for_p3_draft',
    'request_revisions',
    'hold_for_evidence'
  )),
  rationale TEXT NOT NULL,
  carried_forward_caveats JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_next_action TEXT NOT NULL,
  ready_for_p3_draft BOOLEAN NOT NULL DEFAULT false,
  ready_for_p3_final BOOLEAN NOT NULL DEFAULT false,
  p2_final_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS move_artifact_review_decisions_move_phase_idx
  ON public.move_artifact_review_decisions (tenant_key, move_id, phase, created_at DESC);

CREATE INDEX IF NOT EXISTS move_artifact_review_decisions_artifact_idx
  ON public.move_artifact_review_decisions (tenant_key, artifact_id, created_at DESC);

ALTER TABLE public.move_artifact_review_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_move_artifact_review_decisions
  ON public.move_artifact_review_decisions;
CREATE POLICY service_role_all_move_artifact_review_decisions
  ON public.move_artifact_review_decisions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_read_move_artifact_review_decisions
  ON public.move_artifact_review_decisions;
CREATE POLICY authenticated_read_move_artifact_review_decisions
  ON public.move_artifact_review_decisions
  FOR SELECT TO authenticated
  USING (tenant_key = (auth.jwt() ->> 'tenant_key'));

GRANT SELECT ON public.move_artifact_review_decisions TO authenticated;

COMMENT ON TABLE public.move_artifact_review_decisions IS
  'Auditable sponsor/reviewer decisions for premium Moves artifacts. approve_for_p3_draft opens only P3 draft shaping and does not mark P2 final or bypass sponsor/signoff gates.';

COMMIT;
