-- Intelligence artifacts · ephemeral-by-default research outputs
--
-- Generated briefs, memos, one-pagers from Intelligence conversations.
-- governance_state defaults to 'ephemeral' and expires_at is set by the
-- application to session-end + 24h grace. On promotion (one-way, per
-- spec §4.5), governance_state flips to 'persistent', expires_at clears,
-- and promoted_to_deliverable_id links to the deliverables_v2 row.

CREATE TABLE IF NOT EXISTS intelligence_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES intelligence_threads(id) ON DELETE SET NULL,
  turn_id UUID REFERENCES intelligence_thread_turns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('brief','memo','chart','one_pager','custom_html')),
  title TEXT NOT NULL,
  html_content TEXT NOT NULL,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  governance_state TEXT NOT NULL DEFAULT 'ephemeral'
    CHECK (governance_state IN ('ephemeral','persistent')),
  session_id TEXT,
  promoted_to_deliverable_id UUID REFERENCES deliverables_v2(id) ON DELETE SET NULL,
  promoted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
