-- User bookmarks + pinned signals · L4 personalization
--
-- user_bookmarks holds Nexus turns / artifacts / library entries a user
-- pinned for later. user_pinned_signals holds Zone 3 signals the user
-- wants to keep surfaced (normally signals roll off after resolve/dismiss).

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bookmark_type TEXT NOT NULL CHECK (bookmark_type IN (
    'turn','artifact','thread','library_entry','signal'
  )),
  target_id UUID NOT NULL,
  target_kind TEXT,
  note TEXT,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, bookmark_type, target_id)
);

CREATE TABLE IF NOT EXISTS user_pinned_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES portfolio_signals(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, signal_id)
);
