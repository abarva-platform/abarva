-- Indexes for intelligence query patterns
--
-- 1) thread lookup by user (cold landing, thread list)
-- 2) turn scan within thread (State C rail, thread replay)
-- 3) artifact expiry scan (background cleanup of ephemeral artifacts)
-- 4) artifact by thread (render artifact list in thread context)
-- 5) signals sorted by severity desc within client (Zone 3 feed)
-- 6) signals by contradiction source (drill-through from Tower)
-- 7) emergent pattern lookup by pattern + industry + tier
-- 8) bookmarks by user (home personalization)
-- 9) pinned signals by user

CREATE INDEX IF NOT EXISTS idx_intelligence_threads_user
  ON intelligence_threads (user_id, last_turn_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_intelligence_threads_client
  ON intelligence_threads (client_id, last_turn_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_intelligence_thread_turns_thread_index
  ON intelligence_thread_turns (thread_id, index);

CREATE INDEX IF NOT EXISTS idx_intelligence_artifacts_expires
  ON intelligence_artifacts (expires_at)
  WHERE governance_state = 'ephemeral' AND expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intelligence_artifacts_thread
  ON intelligence_artifacts (thread_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_signals_client_fired
  ON portfolio_signals (client_id, severity, fired_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_signals_source_contradiction
  ON portfolio_signals (source_contradiction_id)
  WHERE source_contradiction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emergent_patterns_lookup
  ON emergent_patterns (pattern_key, industry, tier);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user
  ON user_bookmarks (user_id, created_at DESC);
