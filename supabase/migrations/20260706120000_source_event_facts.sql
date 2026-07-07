-- source_event_facts · the persisted Source analytics fact model.
--
-- One row = one typed, cited fact captured against a source event. This is the
-- substrate the deterministic value levers read: the value engine resolves each
-- archetype rule's computation input key to the newest non-stale row for the
-- event (optionally scoped to entity_ref), reads value_numeric/value_text + unit,
-- and carries source_citation + confidence into the grounded answer envelope. A
-- citationRequired fact with no source_citation is not consumable — the lever
-- renders insufficient_evidence rather than guess.
--
-- TS mirror: src/lib/source/facts/fact-types.ts (keep in lockstep).
-- Catalog of valid fact_key values: src/lib/source/facts/fact-catalog.ts.
--
-- RLS follows the source_event_activity convention: service_role full access
-- (agent/operator routes) + authenticated tenant-scoped read/insert via
-- can_read_tenant_by_key(client_key).

CREATE TABLE IF NOT EXISTS source_event_facts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK → the source event this fact was captured against.
  source_event_id   UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  -- Tenant key matching active_clients.key (e.g. 'apexretail', 'meridian'). RLS scope.
  client_key        TEXT NOT NULL,
  -- Canonical fact key; resolves to a FactSpec in fact-catalog.ts.
  fact_key          TEXT NOT NULL,
  -- 'event' | 'tower' | 'app' | 'vendor'
  entity_kind       TEXT NOT NULL DEFAULT 'event',
  -- Nullable reference to the tower / vendor / app the fact is about.
  entity_ref        TEXT,
  -- Numeric value (usd / pct / count / fte / months / ratio). Nullable.
  value_numeric     NUMERIC,
  -- Text value (categorical facts). Nullable.
  value_text        TEXT,
  -- Unit string; mirrors the catalog FactSpec.unit (a ValueUnit).
  unit              TEXT NOT NULL,
  -- 'structured_map' | 'parsed' | 'analyst_entered'
  source_method     TEXT NOT NULL DEFAULT 'analyst_entered',
  -- Provenance for audit + citation: { doc, locator, ... }. Nullable.
  source_citation   JSONB,
  -- 'low' | 'med' | 'high'
  confidence        TEXT NOT NULL DEFAULT 'low',
  captured_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- True when superseded by a newer capture / invalidated evidence.
  is_stale          BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT source_event_facts_entity_kind_chk
    CHECK (entity_kind IN ('event', 'tower', 'app', 'vendor')),
  CONSTRAINT source_event_facts_source_method_chk
    CHECK (source_method IN ('structured_map', 'parsed', 'analyst_entered')),
  CONSTRAINT source_event_facts_confidence_chk
    CHECK (confidence IN ('low', 'med', 'high')),
  -- A fact carries a value in exactly one column (or neither, for a pending stub).
  CONSTRAINT source_event_facts_single_value_chk
    CHECK (value_numeric IS NULL OR value_text IS NULL)
);

-- The value engine's hot path: newest non-stale fact for an event, by key.
CREATE INDEX IF NOT EXISTS source_event_facts_event_key_idx
  ON source_event_facts (source_event_id, fact_key, is_stale, captured_at DESC);

-- Per-tenant scans / RLS-scoped listing.
CREATE INDEX IF NOT EXISTS source_event_facts_client_idx
  ON source_event_facts (client_key, captured_at DESC);

-- Entity-scoped lookups (facts for a given tower / vendor / app).
CREATE INDEX IF NOT EXISTS source_event_facts_entity_idx
  ON source_event_facts (source_event_id, entity_kind, entity_ref);

ALTER TABLE source_event_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_event_facts"
  ON source_event_facts;
CREATE POLICY "service_role_all_source_event_facts"
  ON source_event_facts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_facts"
  ON source_event_facts;
CREATE POLICY "authenticated_read_source_event_facts"
  ON source_event_facts
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

DROP POLICY IF EXISTS "authenticated_insert_source_event_facts"
  ON source_event_facts;
CREATE POLICY "authenticated_insert_source_event_facts"
  ON source_event_facts
  FOR INSERT TO authenticated
  WITH CHECK (can_read_tenant_by_key(client_key));

GRANT SELECT, INSERT ON source_event_facts TO authenticated;

COMMENT ON TABLE source_event_facts IS
  'Persisted Source analytics fact model: typed, cited facts captured against a source event that the deterministic value levers read by fact_key. TS mirror src/lib/source/facts/fact-types.ts; catalog src/lib/source/facts/fact-catalog.ts.';
