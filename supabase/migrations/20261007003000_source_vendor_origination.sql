-- Supplier origination: a supplier that exists in Source before it exists
-- anywhere else, and that cannot be paid.
--
-- Today every row in `source.vendor` arrives from a loader — the conformed
-- vendor record, the contract-depth package, the NDA contact load. There is no
-- application write path at all, so a supplier a category lead wants to
-- approach has nowhere to exist until somebody imports it.
--
-- That is backwards for most of the suppliers a sourcing team actually wants.
-- A supplier is created in the ERP when it starts invoicing, which is AFTER an
-- award. Until then it still needs somewhere to be qualified, sign an NDA and
-- compete. That place is Source.
--
-- TWO POPULATIONS, ONE TABLE
--
-- `source_event_candidate_supplier_authority` has a foreign key to
-- `source.vendor(tenant_key, vendor_id)`, so a supplier that is not in this
-- table cannot be accepted onto an event's panel at all. Putting originated
-- suppliers anywhere else would mean they could never compete, which is the
-- whole point of originating them. So both populations live here and are told
-- apart by a declared column rather than by inference.
--
--   known      the conformed vendor record, loaded from the system that owns it
--   potential  originated in Source; qualified, NDA-capable, and NOT PAYABLE
--
-- WHY "NOT PAYABLE" IS STRUCTURAL, NOT A FLAG
--
-- This table has never had a banking column — no remit-to, no account, no
-- payment terms of any kind — and this migration adds none. A potential
-- supplier is unpayable because the record cannot express how to pay it, not
-- because a boolean says so. Paying one requires the ERP onboarding request
-- that runs at award, and that path sends a request, never a record.
--
-- The default is `known`, so every existing row keeps exactly the meaning it
-- had before this migration: loaded from a system that owns it.

BEGIN;

ALTER TABLE source.vendor
  ADD COLUMN IF NOT EXISTS supplier_population TEXT NOT NULL DEFAULT 'known';

ALTER TABLE source.vendor
  ADD COLUMN IF NOT EXISTS originated_by_user_id TEXT NULL;

ALTER TABLE source.vendor
  ADD COLUMN IF NOT EXISTS originated_at TIMESTAMPTZ NULL;

ALTER TABLE source.vendor
  ADD COLUMN IF NOT EXISTS origination_evidence TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'source_vendor_population_check'
  ) THEN
    ALTER TABLE source.vendor
      ADD CONSTRAINT source_vendor_population_check
      CHECK (supplier_population IN ('known', 'potential'));
  END IF;
END $$;

-- An originated supplier records who originated it, when, and on what basis.
-- A blank passes IS NOT NULL, so each is checked for content rather than
-- presence: "originated by ''" is not a named person.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'source_vendor_origination_check'
  ) THEN
    ALTER TABLE source.vendor
      ADD CONSTRAINT source_vendor_origination_check
      CHECK (
        supplier_population <> 'potential'
        OR (
          NULLIF(BTRIM(originated_by_user_id), '') IS NOT NULL
          AND originated_at IS NOT NULL
          AND NULLIF(BTRIM(origination_evidence), '') IS NOT NULL
        )
      );
  END IF;
END $$;

-- A loaded supplier must not claim to have been originated here. Without this
-- a loader could set the origination fields on a `known` row and the two
-- populations would stop being distinguishable by anything but intent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'source_vendor_known_not_originated_check'
  ) THEN
    ALTER TABLE source.vendor
      ADD CONSTRAINT source_vendor_known_not_originated_check
      CHECK (
        supplier_population <> 'known'
        OR (
          originated_by_user_id IS NULL
          AND originated_at IS NULL
          AND origination_evidence IS NULL
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS source_vendor_population_idx
  ON source.vendor(tenant_key, supplier_population);

COMMENT ON COLUMN source.vendor.supplier_population IS
  'known = the conformed vendor record loaded from the system that owns it. potential = originated in Source: qualifiable, NDA-capable, and not payable. A potential supplier becomes payable only through the ERP onboarding request raised at award, which sends a request and never a record.';

COMMENT ON COLUMN source.vendor.origination_evidence IS
  'Why this supplier was originated and on what basis - a market scan, a referral, a prior event, a self-registration. Required for a potential supplier so that an originated name is never anonymous.';

COMMIT;
