-- Program evidence reviews — the governed promotion ledger for DOCUMENT-derived
-- current-state evidence.
--
-- program_evidence_items is append-only (a document upload records exactly what
-- was extracted, with citations, and is never mutated). Whether that extracted
-- evidence COUNTS as committed current-state evidence for a Move is a SEPARATE,
-- governed decision recorded here. This enforces the honest ladder for documents:
--
--   document uploaded → parsed → program_evidence_items row (append-only)
--                     → program_evidence_reviews row decision='pending'  (review_required)
--                     → human approval                decision='approved' (committed)
--
-- Clean structured data (CSV → tower_*, or a schema-validated XLSX KPI table) may
-- be auto-approved at ingest (decision='approved', auto_promoted=true) — that is
-- the founder-sanctioned exception for deterministic structured mappings, mirrored
-- on the CSV→tower path. Free-form PDF/PPTX/DOCX NEVER auto-promotes.
--
-- Control-plane scoped; one active review row per evidence item.

CREATE TABLE IF NOT EXISTS program_evidence_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES program_evidence_items(id) ON DELETE CASCADE,
  family_key TEXT NOT NULL,
  archetype_id TEXT NULL,
  phase INT NULL,
  decision TEXT NOT NULL DEFAULT 'pending'
    CHECK (decision IN ('pending', 'approved', 'rejected')),
  auto_promoted BOOLEAN NOT NULL DEFAULT false,
  rationale TEXT NULL,
  source_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_by_user_id TEXT NOT NULL,
  reviewed_by_user_id TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One review row per evidence item (the promotion record for that document fact).
CREATE UNIQUE INDEX IF NOT EXISTS uq_program_evidence_reviews_evidence
  ON program_evidence_reviews (evidence_id);

-- The hot path: "for this move + family, are there approved / pending reviews?"
CREATE INDEX IF NOT EXISTS idx_program_evidence_reviews_lookup
  ON program_evidence_reviews (tenant_key, program_id, family_key, decision);

ALTER TABLE program_evidence_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_program_evidence_reviews" ON program_evidence_reviews;
CREATE POLICY "service_role_all_program_evidence_reviews" ON program_evidence_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_program_evidence_reviews" ON program_evidence_reviews;
CREATE POLICY "authenticated_read_program_evidence_reviews" ON program_evidence_reviews
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM engagements)
  );

GRANT SELECT ON program_evidence_reviews TO authenticated;
