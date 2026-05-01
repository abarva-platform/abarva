-- Program evidence items
-- Structured evidence extracted from uploaded artifacts, meeting notes,
-- workshop outputs, and Nexus-generated artifacts. This is intentionally
-- control-plane scoped: it records what the program used as evidence without
-- exposing private source content outside the tenant boundary.

CREATE TABLE IF NOT EXISTS program_evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  attachment_id UUID REFERENCES program_attachments(id) ON DELETE SET NULL,
  phase INT NULL,
  step_id TEXT NULL,
  evidence_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  extracted_text TEXT NULL,
  extracted_structured JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 0.70,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_evidence_items_tenant_program
  ON program_evidence_items (tenant_key, program_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_evidence_items_phase
  ON program_evidence_items (program_id, phase, step_id)
  WHERE phase IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_evidence_items_attachment
  ON program_evidence_items (attachment_id)
  WHERE attachment_id IS NOT NULL;

ALTER TABLE program_evidence_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_program_evidence_items" ON program_evidence_items;
CREATE POLICY "service_role_all_program_evidence_items" ON program_evidence_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_program_evidence_items" ON program_evidence_items;
CREATE POLICY "authenticated_read_program_evidence_items" ON program_evidence_items
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM engagements)
  );

DROP POLICY IF EXISTS "authenticated_insert_program_evidence_items" ON program_evidence_items;
CREATE POLICY "authenticated_insert_program_evidence_items" ON program_evidence_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND created_by_user_id = (auth.jwt() ->> 'sub')
    AND program_id IN (SELECT id FROM engagements)
  );

-- Evidence records are append-only. Corrections create a new evidence row and
-- point back to the prior row in extracted_structured.supersedes_id.
DROP POLICY IF EXISTS "authenticated_update_program_evidence_items" ON program_evidence_items;
DROP POLICY IF EXISTS "authenticated_delete_program_evidence_items" ON program_evidence_items;
CREATE POLICY "authenticated_update_program_evidence_items" ON program_evidence_items
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "authenticated_delete_program_evidence_items" ON program_evidence_items
  FOR DELETE TO authenticated USING (false);

GRANT SELECT, INSERT ON program_evidence_items TO authenticated;
