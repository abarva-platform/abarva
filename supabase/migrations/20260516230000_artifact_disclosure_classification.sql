-- Source artifact · disclosure-classification persistence (GAP-9)
--
-- Wave C1 (PR #2112) shipped a typed legal-privileged disclosure flag at the
-- app tier (src/lib/source/disclosure-flag/), attached as an optional
-- `disclosureFlag` on SourceArtifactRegistryRecord. It was deliberately kept
-- app-tier (no DB column) to honor a migration-free constraint. This residual
-- adds the persistence so the flag round-trips through the registry.
--
-- The disclosure flag is an orthogonal axis to `data_classification`
-- (Public…Restricted, a sensitivity axis). It marks whether artifact content
-- is legal-privileged and carries that marking — including inheritance
-- provenance — as the artifact moves through the loop.
--
-- Stored as JSONB because the flag is a value object with several correlated
-- fields (classification, privileged, setBy, privilegeHolder, basis,
-- inheritedFromArtifactId). NULL means "no disclosure flag attached"; the app
-- treats that as the default non-privileged flag.
--
-- Additive and nullable: existing rows are unaffected, no backfill required.
--
-- RLS: source_artifacts already has ROW LEVEL SECURITY enabled with
-- service_role / tenant-scoped authenticated policies
-- (20260430220000_source_artifact_registry.sql). Column-level access in
-- Postgres is governed by the table's RLS policies — a new column on an
-- RLS-protected table is automatically covered by the existing policies.
-- No new policy is required.
--
-- Authored, NOT applied — the founder runs `db:migrate`.

BEGIN;

ALTER TABLE source_artifacts
  ADD COLUMN IF NOT EXISTS disclosure_classification JSONB;

COMMENT ON COLUMN source_artifacts.disclosure_classification IS
  'GAP-9 · typed legal-privileged disclosure flag (value object). Orthogonal '
  'to data_classification. Shape mirrors ArtifactDisclosureFlag in '
  'src/lib/source/disclosure-flag/types.ts: { classification, privileged, '
  'setBy, privilegeHolder, basis, inheritedFromArtifactId }. NULL means no '
  'disclosure flag is attached; the app treats that as the default '
  'non-privileged flag. Covered by the table''s existing RLS policies.';

NOTIFY pgrst, 'reload schema';

COMMIT;
