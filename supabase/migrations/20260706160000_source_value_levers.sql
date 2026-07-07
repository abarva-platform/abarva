-- source_value_levers · persisted per-event value-lever instances.
--
-- One row = one computed value-lever result for a source event: the deterministic
-- output of an archetype value-lever rule's formula evaluated against the event's
-- source_event_facts. The value engine computes ValueLeverResult[] (see
-- src/lib/source/facts/evaluators/), then persists the banded, typed, cited
-- outcome here so the value-type waterfall and the grounded answer can be
-- reproduced and audited without re-running the math.
--
-- The NUMBER is always a band (est_low_usd .. est_high_usd) — never a point
-- presented as fact. A lever that lacked required evidence is NOT persisted as a
-- guess; it is either omitted or written with insufficient_evidence = true and
-- null bounds. evidence_refs records exactly which facts fed the computation.
--
-- TS mirror: src/lib/source/facts/evaluators/value-lever-write-adapter.ts.
-- Result shape: ValueLeverResult in src/lib/source/facts/evaluators/types.ts.
--
-- RLS follows the source_event_facts convention: service_role full access
-- (agent/operator compute routes) + authenticated tenant-scoped read/insert via
-- can_read_tenant_by_key(client_key).

CREATE TABLE IF NOT EXISTS source_value_levers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK → the source event this lever was computed for.
  source_event_id       UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  -- Tenant key matching active_clients.key. RLS scope.
  client_key            TEXT NOT NULL,
  -- The archetype value-lever rule key, e.g. 'AMS.ENHANCEMENT_LEAKAGE'.
  lever_key             TEXT NOT NULL,
  -- Human name from the rule.
  lever_name            TEXT NOT NULL,
  -- One of the five value TYPES the lever contributes to.
  value_type            TEXT NOT NULL,
  -- The formulaId that produced the number (audit / reproducibility).
  formula_id            TEXT NOT NULL,
  -- Banded estimate in USD over the term. Null when insufficient_evidence.
  est_low_usd           NUMERIC,
  est_high_usd          NUMERIC,
  -- 'low' | 'med' | 'high'
  confidence            TEXT NOT NULL DEFAULT 'low',
  -- Plain-English basis (the rule's valueBasis).
  basis                 TEXT,
  -- Human-readable derivation trace (method with values substituted).
  derivation_trace      TEXT,
  -- The facts that fed the computation: [{ factKey, value }, ...].
  evidence_refs         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- True when the lever could not be computed for lack of evidence.
  insufficient_evidence BOOLEAN NOT NULL DEFAULT false,
  -- When insufficient, the fact keys that were missing.
  missing_evidence      JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT source_value_levers_value_type_chk
    CHECK (value_type IN (
      'expected_concession',
      'incremental_negotiated',
      'solution_tightening',
      'protected',
      'risk_adjusted'
    )),
  CONSTRAINT source_value_levers_confidence_chk
    CHECK (confidence IN ('low', 'med', 'high')),
  -- A computed lever carries a band; an insufficient one carries neither bound.
  CONSTRAINT source_value_levers_band_chk
    CHECK (
      (insufficient_evidence = true  AND est_low_usd IS NULL AND est_high_usd IS NULL)
      OR
      (insufficient_evidence = false AND est_low_usd IS NOT NULL AND est_high_usd IS NOT NULL
        AND est_low_usd <= est_high_usd)
    )
);

-- Hot path: the newest computed levers for an event.
CREATE INDEX IF NOT EXISTS source_value_levers_event_idx
  ON source_value_levers (source_event_id, computed_at DESC);

-- Per-event lever lookup by key (recompute / supersede).
CREATE INDEX IF NOT EXISTS source_value_levers_event_key_idx
  ON source_value_levers (source_event_id, lever_key, computed_at DESC);

-- Per-tenant scans / RLS-scoped listing.
CREATE INDEX IF NOT EXISTS source_value_levers_client_idx
  ON source_value_levers (client_key, computed_at DESC);

-- Value-type roll-up (waterfall) scans.
CREATE INDEX IF NOT EXISTS source_value_levers_value_type_idx
  ON source_value_levers (source_event_id, value_type);

ALTER TABLE source_value_levers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_value_levers"
  ON source_value_levers;
CREATE POLICY "service_role_all_source_value_levers"
  ON source_value_levers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_value_levers"
  ON source_value_levers;
CREATE POLICY "authenticated_read_source_value_levers"
  ON source_value_levers
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

DROP POLICY IF EXISTS "authenticated_insert_source_value_levers"
  ON source_value_levers;
CREATE POLICY "authenticated_insert_source_value_levers"
  ON source_value_levers
  FOR INSERT TO authenticated
  WITH CHECK (can_read_tenant_by_key(client_key));

GRANT SELECT, INSERT ON source_value_levers TO authenticated;

COMMENT ON TABLE source_value_levers IS
  'Persisted per-event value-lever instances: the deterministic banded output of archetype value-lever rules evaluated against source_event_facts. Feeds the value-type waterfall. TS mirror src/lib/source/facts/evaluators/value-lever-write-adapter.ts; result shape ValueLeverResult in evaluators/types.ts.';
