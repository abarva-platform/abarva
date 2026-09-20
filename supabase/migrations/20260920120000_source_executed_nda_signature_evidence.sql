-- Signature evidence for an executed NDA.
--
-- `source_executed_nda_authority` records that a document was filed, by whom,
-- under which template, covering which scope. It does not record that anyone
-- signed it. A hash proves the bytes did not change; it says nothing about
-- whose signature is on them, or whether both sides signed at all — so a scan
-- of an unsigned draft, uploaded and recorded, is indistinguishable from an
-- executed agreement.
--
-- Two of the fields the governed evidence contract wants already exist and are
-- deliberately not duplicated here:
--
--   * the document hash, reachable through `artifact_id` ->
--     `source_artifacts.blob_sha256`, which the Stage 05 read path already
--     requires to be present;
--   * the signature date, which is `executed_at`.
--
-- Every column added here is NULLABLE, and that is not laxity. Existing rows
-- carry none of this, and a NOT NULL column would fail the migration against
-- real data. The contract in `src/lib/source/nda/executed-document-evidence.ts`
-- is where completeness is judged; this table records what was captured.
--
-- The conditional rule — an out-of-band electronic signature must carry a
-- completion certificate — is deliberately NOT a CHECK. Enforcing it here
-- would reject a row written before the certificate arrives, forcing a
-- two-phase write for an ordinary sequence, and a constraint violation says
-- far less to an operator than the contract's stated defect does.
--
-- Nor is there a constraint on when the signature date may fall. An earlier
-- draft of this migration added one, and it would have been a speculative
-- constraint against rows nobody here can inspect: if any existing row
-- violated it, the migration fails on apply. The contract checks the date
-- against the evaluation clock, which is the check that matters for a stale
-- record, and it produces a readable defect instead of a constraint error.

DO $executed_nda_signature_evidence$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'source_executed_nda_authority'
      AND column_name = 'signature_method'
  ) THEN
    ALTER TABLE source_executed_nda_authority
      ADD COLUMN signature_method TEXT NULL,
      ADD COLUMN supplier_signatory_name TEXT NULL,
      ADD COLUMN buyer_signatory_name TEXT NULL,
      ADD COLUMN certificate_sha256 TEXT NULL,
      ADD COLUMN private_evidence_ref TEXT NULL;
  END IF;

  -- The vocabulary is constrained so a value the contract cannot interpret
  -- never reaches it. `unknown` is permitted and is not a pass: the contract
  -- refuses it, because a declared value that declares nothing is how an enum
  -- becomes a presence flag.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_executed_nda_authority'::regclass
      AND conname = 'source_executed_nda_authority_signature_method_check'
  ) THEN
    ALTER TABLE source_executed_nda_authority
      ADD CONSTRAINT source_executed_nda_authority_signature_method_check
      CHECK (
        signature_method IS NULL
        OR signature_method IN ('wet_ink', 'e_signature_out_of_band', 'unknown')
      );
  END IF;

END;
$executed_nda_signature_evidence$;
