-- Emergent patterns · cross-client aggregates (Tier-safe)
--
-- Aggregated outcomes from multiple clients. Hard DB constraint:
-- cohort_size >= 3. Never stores client IDs — only SHA-256 hashes of
-- contributing client IDs for auditability. Per spec §7.3, §9.10 call #7.
--
-- Contributing clients are stored as TEXT[] of hashes (not UUIDs) to
-- prevent reversal via FK lookups. Queries by cohort use the hashes
-- directly; un-hashing is architecturally impossible.

CREATE TABLE IF NOT EXISTS emergent_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_key TEXT NOT NULL,
  industry TEXT NOT NULL,
  tier TEXT NOT NULL,
  cohort_size INT NOT NULL CHECK (cohort_size >= 3),
  aggregate_outcomes_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  contributing_client_hashes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  last_aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pattern_key, industry, tier)
);
