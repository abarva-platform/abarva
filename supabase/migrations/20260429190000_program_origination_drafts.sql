-- PROGRAMS-S1-PR3 · in-flight conversation persistence for /programs/new
--
-- Closes Crawl Obs #4 (Steward conversation lost on reload). Steward's
-- origination conversation persists here as a JSONB blob keyed by
-- (user_id, client_id, surface). On page reload, the workspace
-- hydrates from the draft; on commit_program success, the draft
-- transitions to "committed" and is dissociated from the surface so a
-- subsequent /programs/new visit starts fresh.
--
-- We use a dedicated table rather than the engagements table because
-- the conversation may abandon without ever producing a program; we
-- don't want to create an engagement record we then have to clean up.
-- When the conversation does commit, `committed_engagement_id` links
-- the draft to the resulting engagement for audit / replay.
--
-- One open draft per (user, client, surface) — enforced by a partial
-- unique index that ignores committed rows. Subsequent abandoned
-- drafts overwrite the prior one for the same surface.

BEGIN;

CREATE TABLE IF NOT EXISTS program_origination_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  surface TEXT NOT NULL,
  -- Full state blob — turns array + brief draft + matched pattern card.
  -- Schema: { turns: [...], brief: {...}, patternMatch: {...} | null }
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- When commit_program succeeds, this points at the resulting
  -- engagements.id row. Until then it's NULL and the draft is "open".
  committed_engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_origination_drafts_user_surface
  ON program_origination_drafts (user_id, surface) WHERE committed_engagement_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_origination_drafts_client
  ON program_origination_drafts (client_id);

-- One open draft per (user_id, client_id, surface). Closing the loop
-- on commit (setting committed_engagement_id) frees the slot for a
-- new origination.
CREATE UNIQUE INDEX IF NOT EXISTS uq_origination_drafts_open
  ON program_origination_drafts (user_id, client_id, surface)
  WHERE committed_engagement_id IS NULL;

-- Auto-touch updated_at on any update.
CREATE OR REPLACE FUNCTION touch_origination_draft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_origination_drafts_touch
  ON program_origination_drafts;
CREATE TRIGGER trg_origination_drafts_touch
  BEFORE UPDATE ON program_origination_drafts
  FOR EACH ROW EXECUTE FUNCTION touch_origination_draft_updated_at();

COMMIT;
