-- Preserve an event-scoped FK when older Source events hold a declared tenant alias.
-- The template keeps the canonical tenant key; the generated parent key mirrors
-- the existing SQL canonicalizer without changing the event's stored identity.

ALTER TABLE source_events
  ADD COLUMN canonical_client_key TEXT
    GENERATED ALWAYS AS (canonical_tenant_key(client_key)) STORED;

ALTER TABLE source_events
  ADD CONSTRAINT source_events_id_canonical_client_key_unique
    UNIQUE (id, canonical_client_key);

ALTER TABLE source_nda_template_versions
  DROP CONSTRAINT source_nda_template_versions_event_scope_fk;

ALTER TABLE source_nda_template_versions
  ADD CONSTRAINT source_nda_template_versions_event_scope_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events (id, canonical_client_key);

COMMENT ON COLUMN source_events.canonical_client_key IS
  'Canonical tenant identity for event-scoped foreign keys; client_key remains the declared legacy source value.';
