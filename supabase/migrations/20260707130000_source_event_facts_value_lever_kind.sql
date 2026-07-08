-- source_event_facts · admit the `value_lever` entity kind.
--
-- The downstream-insight fact-model extension (see
-- docs/build/source-downstream-insight-fact-model.md) adds a new entity kind
-- `value_lever`: a fact of this kind hangs off a canonical archetype lever key
-- via entity_ref (e.g. 'AMS.VOLUME_BAND_PRICING') so per-lever signals (RFP
-- clause coverage, BAFO, committed value) can be captured WITHOUT faking
-- composite fact keys. This widens the entity_kind CHECK to allow it.
--
-- TS mirror: FactEntityKind in src/lib/source/facts/fact-catalog.ts (keep in
-- lockstep). No data migration is needed — the constraint only ADDS an allowed
-- value; every existing row already satisfies the widened set.

ALTER TABLE source_event_facts
  DROP CONSTRAINT IF EXISTS source_event_facts_entity_kind_chk;

ALTER TABLE source_event_facts
  ADD CONSTRAINT source_event_facts_entity_kind_chk
    CHECK (entity_kind IN ('event', 'tower', 'app', 'vendor', 'value_lever'));
