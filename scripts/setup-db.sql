-- AbarVa: dataset_files table
-- Run once in Supabase SQL editor:
-- https://supabase.com/dashboard/project/xtbymdryojmvoulaotce/sql

CREATE TABLE IF NOT EXISTS dataset_files (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_name text        NOT NULL,
  file_name     text        NOT NULL,
  client_id     text        NOT NULL,
  uploaded_by   text        NOT NULL DEFAULT 'Anand Sundaram · Admin',
  confidence    integer     NOT NULL DEFAULT 85,
  date          date        NOT NULL DEFAULT CURRENT_DATE,
  storage_path  text,
  storage_url   text,
  status        text        NOT NULL DEFAULT 'active',
  created_at    timestamptz DEFAULT now()
);

-- Index for fast client lookups
CREATE INDEX IF NOT EXISTS dataset_files_client_id_idx ON dataset_files (client_id);

-- Enable RLS (optional but recommended)
ALTER TABLE dataset_files ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by the seed script + API)
CREATE POLICY IF NOT EXISTS "service role full access"
  ON dataset_files FOR ALL
  USING (true)
  WITH CHECK (true);
