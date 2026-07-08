-- source_event_facts · admit the `vendor_lever` entity kind.
--
-- The multi-vendor fact-model extension (Phase 2 — see
-- docs/build/source-multivendor-fact-model.md) adds a new entity kind
-- `vendor_lever`: a fact of this kind captures a VENDOR's answer to a LEVER via a
-- canonical composite entity_ref '<vendorId>::<leverKey>' (e.g.
-- 'Vega Systems::AMS.VOLUME_BAND_PRICING') so Responses coverage can carry a
-- per-vendor / per-lever signal WITHOUT faking composite fact keys. This widens
-- the entity_kind CHECK to allow it.
--
-- TS mirror: FactEntityKind in src/lib/source/facts/fact-catalog.ts (keep in
-- lockstep). No data migration is needed — the constraint only ADDS an allowed
-- value; every existing row already satisfies the widened set.
--
-- APPLY VIA THE VNet MIGRATE JOB (job-abarva-db-migrate-lab-eastus) at deploy
-- time, per the ACA data-build-job rule. Do NOT run from a feature branch, from
-- localhost (which cannot reach the private Postgres), or from a product web
-- request.

ALTER TABLE source_event_facts
  DROP CONSTRAINT IF EXISTS source_event_facts_entity_kind_chk;

ALTER TABLE source_event_facts
  ADD CONSTRAINT source_event_facts_entity_kind_chk
    CHECK (entity_kind IN ('event', 'tower', 'app', 'vendor', 'value_lever', 'vendor_lever'));
</content>
