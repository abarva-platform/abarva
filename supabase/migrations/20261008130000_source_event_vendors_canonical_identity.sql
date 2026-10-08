-- Source — the vendor RFP portal references the canonical supplier identity.
--
-- `source_event_vendors` identified a competing supplier by two free-text
-- columns, `vendor_legal_name` and `vendor_display_name`, and by nothing else.
-- The same supplier invited to two solicitations was therefore two
-- unconnected rows with two spellings of one name, and no join existed back to
-- the governed record in `source.vendor`.
--
-- The identity already exists and is already governed. Accepting a supplier
-- onto an event's candidate panel writes
-- `source_event_candidate_supplier_authority`, whose `(client_key, vendor_id)`
-- references `source.vendor(tenant_key, vendor_id)`. The portal must point at
-- that, not mint a second identity beside it.
--
-- WHY THE NAME COLUMNS STAY. They are a display cache, not identity: an
-- invitation email and a portal page show the supplier the name it was invited
-- under, and that must not change retroactively when the governed legal name is
-- later corrected. They are no longer the thing that says WHICH supplier this
-- is. `vendor-identity.ts` refuses to build a portal record from a name.
--
-- WHY THE COLUMN IS NULLABLE. The column cannot be added `NOT NULL` safely:
-- `20260925090000` has never been applied to a shared database by this repo,
-- but this file cannot prove no row exists anywhere, and a failed `SET NOT NULL`
-- on a populated table would block every later migration behind it. The
-- not-null rule is enforced one layer up instead - no code path may create a
-- portal vendor without a resolved canonical id, which `vendor-identity.ts`
-- and its suite pin. Tightening the column is a follow-on once the table is
-- known empty on every applied database.

BEGIN;

ALTER TABLE source_event_vendors
  ADD COLUMN IF NOT EXISTS vendor_id TEXT;

COMMENT ON COLUMN source_event_vendors.vendor_id IS
  'Canonical supplier identity: source.vendor(tenant_key, vendor_id), taken from the accepted candidate authority for this event. The name columns beside it are a display cache and are not identity.';

COMMENT ON COLUMN source_event_vendors.vendor_legal_name IS
  'Display cache of the name this supplier was invited under. Not identity - see vendor_id.';

COMMENT ON COLUMN source_event_vendors.vendor_display_name IS
  'Display cache of the name this supplier was invited under. Not identity - see vendor_id.';

-- The join back to the governed record. Composite with the tenant so a vendor
-- id cannot be borrowed across tenants.
ALTER TABLE source_event_vendors
  DROP CONSTRAINT IF EXISTS source_event_vendors_canonical_vendor_fk;
ALTER TABLE source_event_vendors
  ADD CONSTRAINT source_event_vendors_canonical_vendor_fk
  FOREIGN KEY (tenant_key, vendor_id)
  REFERENCES source.vendor(tenant_key, vendor_id);

-- One canonical supplier appears at most once per solicitation. This is the
-- "do not create a second supplier identity" rule as a constraint rather than a
-- convention: a second invitation for the same governed supplier on the same
-- event is refused by the database, whatever name it carries.
--
-- Partial, so rows predating the column do not collide with each other on NULL.
CREATE UNIQUE INDEX IF NOT EXISTS source_event_vendors_event_vendor_uq
  ON source_event_vendors (source_event_id, vendor_id)
  WHERE vendor_id IS NOT NULL;

-- Reading one supplier's portal rows across every event it competes in is the
-- query this whole change exists to make possible.
CREATE INDEX IF NOT EXISTS source_event_vendors_tenant_vendor_idx
  ON source_event_vendors (tenant_key, vendor_id);

COMMIT;
