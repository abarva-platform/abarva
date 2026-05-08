-- Agent attachments · shared substrate for the AgentDock foundation.
--
-- Stores per-tenant file uploads made through the agent chat composer
-- across every surface (Source, Moves, Intelligence, Tower, Admin).
-- The blob lives in the `agent-attachments` Supabase Storage bucket;
-- this row carries metadata + the extracted text snippet so server
-- routes can hand the agent a usable preview without re-fetching the
-- blob on every turn.
--
-- Linkage columns (`linked_event_id`, `linked_move_id`) are nullable on
-- purpose. The bare migration only stands the table up — the per-
-- surface migrations (Source canvas, Move detail, etc.) backfill the
-- foreign-key references so attachments can be associated with the
-- domain entity once the agent commits the message that referenced
-- them.
--
-- Manual setup step (NOT automated here): create the
-- `agent-attachments` bucket in Supabase Storage with bucket policy
-- enforcing tenant-scoped path prefixes. The route only writes to
-- `{tenant_id}/{user_id}/{uuid}-{filename}`; bucket-level RLS keeps
-- cross-tenant reads honest even if the path is leaked.
--
-- Spec: this PR · feat(agent): shared AgentDock with 5 modes + Claude-
-- style upload (foundation).

BEGIN;

CREATE TABLE IF NOT EXISTS agent_attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  surface TEXT NOT NULL,           -- e.g. 'source/new', 'source/events/canvas', 'moves/detail'
  agent TEXT NOT NULL,             -- 'sentinel' | 'nexus' | 'atlas' | 'steward'
  user_id TEXT NOT NULL,           -- Clerk user id (string, not UUID)
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,      -- relative path inside agent-attachments bucket
  extracted_text TEXT,             -- nullable; null for image MIMEs and parse failures
  linked_event_id UUID,            -- backfilled by source canvas migration later
  linked_move_id UUID,             -- backfilled by move detail migration later
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Common query path: list a user's attachments for the active surface,
-- excluding soft-deleted rows.
CREATE INDEX IF NOT EXISTS idx_agent_attachment_tenant_surface
  ON agent_attachment (tenant_id, surface)
  WHERE deleted_at IS NULL;

-- Per-event lookup once the canvas migration wires this up.
CREATE INDEX IF NOT EXISTS idx_agent_attachment_event
  ON agent_attachment (linked_event_id)
  WHERE linked_event_id IS NOT NULL AND deleted_at IS NULL;

-- Per-move lookup once Moves detail migration wires this up.
CREATE INDEX IF NOT EXISTS idx_agent_attachment_move
  ON agent_attachment (linked_move_id)
  WHERE linked_move_id IS NOT NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- RLS · tenant isolation
-- ---------------------------------------------------------------------
-- The route handler runs with the service-role key, which bypasses RLS
-- by design. RLS still matters for any future direct-from-client query
-- via the anon key — keep the policy strict.

ALTER TABLE agent_attachment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_attachment_tenant_isolation ON agent_attachment;
CREATE POLICY agent_attachment_tenant_isolation ON agent_attachment
  FOR ALL
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

COMMIT;
