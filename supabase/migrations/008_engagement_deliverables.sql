-- engagement_deliverables · superseded by deliverables_v2 (migration 040).
-- This migration is retained for replay safety on fresh preview branches.
-- Original drop+recreate replaced with idempotent CREATE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS engagement_deliverables (
  id              uuid primary key default gen_random_uuid(),
  engagement_id   text not null,
  client_id       text not null,
  phase           integer not null,
  document_type   text not null,
  title           text not null,
  html_content    text not null,
  generated_at    timestamptz default now(),
  generated_by    text
);

ALTER TABLE engagement_deliverables ENABLE ROW LEVEL SECURITY;

-- Allow all reads and inserts (internal tool — no strict per-user scoping)
DROP POLICY IF EXISTS "allow_read"   ON engagement_deliverables;
DROP POLICY IF EXISTS "allow_insert" ON engagement_deliverables;
DROP POLICY IF EXISTS "allow_update" ON engagement_deliverables;
DROP POLICY IF EXISTS "allow_delete" ON engagement_deliverables;

CREATE POLICY "allow_read"   ON engagement_deliverables FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON engagement_deliverables FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON engagement_deliverables FOR UPDATE USING (true);
CREATE POLICY "allow_delete" ON engagement_deliverables FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_ed_client_id     ON engagement_deliverables (client_id);
CREATE INDEX IF NOT EXISTS idx_ed_engagement_id ON engagement_deliverables (engagement_id);
