-- Drop old table (empty, wrong schema) and recreate with correct schema
DROP TABLE IF EXISTS engagement_deliverables;

CREATE TABLE engagement_deliverables (
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
CREATE POLICY "allow_read"   ON engagement_deliverables FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON engagement_deliverables FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON engagement_deliverables FOR UPDATE USING (true);
CREATE POLICY "allow_delete" ON engagement_deliverables FOR DELETE USING (true);

CREATE INDEX idx_ed_client_id     ON engagement_deliverables (client_id);
CREATE INDEX idx_ed_engagement_id ON engagement_deliverables (engagement_id);
