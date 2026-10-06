-- An NDA waiver is authority for a governed supplier legal entity, not for an
-- unverified supplier-name string. Bind every waiver to source.vendor before
-- Stage 05 consumes the record.

DO $waiver_supplier_authority$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM source_event_nda_waivers waiver
    LEFT JOIN source.vendor vendor
      ON vendor.tenant_key = waiver.client_key
     AND vendor.vendor_id = waiver.supplier_legal_entity_id
    WHERE vendor.vendor_id IS NULL
  ) THEN
    RAISE EXCEPTION 'source_event_nda_waivers contains supplier identities absent from source.vendor';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'source_event_nda_waivers'::regclass
      AND conname = 'source_event_nda_waivers_supplier_fk'
  ) THEN
    ALTER TABLE source_event_nda_waivers
      ADD CONSTRAINT source_event_nda_waivers_supplier_fk
      FOREIGN KEY (client_key, supplier_legal_entity_id)
      REFERENCES source.vendor(tenant_key, vendor_id);
  END IF;
END;
$waiver_supplier_authority$;

COMMENT ON CONSTRAINT source_event_nda_waivers_supplier_fk
  ON source_event_nda_waivers IS
  'NDA waiver supplier identity must resolve to the governed tenant-scoped supplier legal entity registry.';
