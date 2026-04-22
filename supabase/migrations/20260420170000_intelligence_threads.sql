-- Intelligence threads · ephemeral research threads (L4 user-owned)
--
-- Holds the Intelligence-page conversation container. One thread per
-- research session. Tracks A/B/C state for UI restoration, optional
-- attachment to an engagement (UI says "program"; DB stays "engagement"
-- per session lock). Per spec §7.3 + §9.3.

CREATE TABLE IF NOT EXISTS intelligence_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  conversation_id UUID,
  title TEXT,
  state TEXT NOT NULL DEFAULT 'A' CHECK (state IN ('A','B','C')),
  attached_engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_turn_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
