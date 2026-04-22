-- Intelligence thread turns · per-turn Nexus conversation storage
--
-- Parallel to the engagement-scoped `turns` table. Captures one row per
-- user or Nexus turn with the full NexusTurnData payload. Supports the
-- 3 modes × 8 formats × composable capabilities defined in Packet 2.
-- Counter-argument turns link to their originator via counter_of_turn_id.
-- Contradiction self-checks (Cap 5) are stored inline as JSON.

CREATE TABLE IF NOT EXISTS intelligence_thread_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES intelligence_threads(id) ON DELETE CASCADE,
  index INT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','nexus','system')),
  mode TEXT CHECK (mode IN ('research','grounded','pivot')),
  format TEXT CHECK (format IN (
    'one_sentence','matrix','crux','ranked_list',
    'artifact','clarification','counter_pair','idk'
  )),
  confidence TEXT CHECK (confidence IN ('high','medium','low')),
  payload_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  sources_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  capabilities_active TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  counter_of_turn_id UUID REFERENCES intelligence_thread_turns(id) ON DELETE SET NULL,
  contradiction_self_check JSONB,
  persona_key TEXT,
  latency_ms INT,
  first_token_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (thread_id, index)
);
