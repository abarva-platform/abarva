-- Portfolio signals · Zone 3 feed
--
-- Cross-program signals surfaced in Intelligence Zone 3. Six categories
-- defined in spec §7.1. Contradiction agent runs async every 15min and
-- writes rows here; source FK back to `contradictions` table where
-- applicable (some signals like shadow_ai are generated from other
-- detectors and have source_contradiction_id NULL).

CREATE TABLE IF NOT EXISTS portfolio_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'contradiction',
    'vendor_overlap',
    'pattern_emerging',
    'shadow_ai',
    'portfolio_risk',
    'benchmark_drift'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical','warning','info')),
  headline TEXT NOT NULL,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_contradiction_id UUID REFERENCES contradictions(id) ON DELETE SET NULL,
  affected_engagement_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  sponsor_notified BOOLEAN NOT NULL DEFAULT false,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_by_user_id UUID REFERENCES persons(id) ON DELETE SET NULL
);
