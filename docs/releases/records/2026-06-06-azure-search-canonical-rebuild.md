# 2026-06-06-azure-search-canonical-rebuild — Azure Search Canonical Rebuild

## Release ID

`2026-06-06-azure-search-canonical-rebuild`

## Status

`candidate`

## Plain-English Summary

This change hardens the Azure AI Search backfill used after the Supabase-to-Azure drain. It normalizes legacy tenant keys before writing search documents and caps oversized chunk bodies so Azure Search does not silently reject long records. A one-time Azure Container Apps job parameter file documents the canonical rebuild command used to rebuild `tenant-context-v1` from Azure Postgres.

## Layer Impact

- `client-data-lane`: Rebuilds the tenant context search index from Azure Postgres and keeps client chunks under canonical tenant keys.
- `global-control-lane`: Updates the shared Azure Search backfill mapper used by future rebuilds.
- `internal-admin`: Adds an operator-only one-time Azure parameter file for the verified rebuild path.

## Client Applicability

- All clients: Azure Search tenant-context retrieval uses the same canonical key and body-size rules.
- Specific clients: Live rebuild evidence covers Apex Retail, First Capital, Lakeshore Holdings, Meridian Health, Northstar Clinical, and SkyHarbor Air.
- Internal only: The one-time rebuild parameter file is for AbarVa operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/azure-search/tenant-context-backfill.ts`
  - Adds tenant-key aliases for Lakeshore, SkyHarbor, Northstar, First Capital, Apex, and Meridian variants.
  - Normalizes tenant keys by trimming, lowercasing, and converting underscores to hyphens.
  - Caps Azure Search document body text at 30,000 UTF-8 bytes to avoid Azure Search term-size rejection.
- `src/lib/azure-search/__tests__/tenant-context-backfill.test.ts`
  - Covers expanded tenant-key aliases.
  - Covers oversized body truncation.
- `infra/azure/parameters/search-canonical-rebuild.once.lab.bicepparam`
  - Documents the one-time Azure Container Apps job used to delete/recreate `tenant-context-v1`, recreate index contracts, upload Azure Postgres chunks with canonical tenant keys, inspect per-document upload failures, and verify canonical counts.

## QA / Validation

- Unit test passed:
  - `npx jest src/lib/azure-search/__tests__/tenant-context-backfill.test.ts --no-coverage`
  - Result: 1 suite passed, 4 tests passed.
- Azure one-time canonical rebuild succeeded:
  - Deployment: `az-search-canonical-rebuild-20260606193458`
  - Execution: `job-a24-search-canon-eus-ac5kk3z`
  - Result: `Succeeded`
- Azure Search live verification from job logs:
  - Source rows uploaded: `21,967`
  - Expected and observed canonical search document counts matched:
    - `apex-retail`: `6,497`
    - `first-capital`: `400`
    - `lakeshore-holdings`: `6,576`
    - `meridian-health`: `4,376`
    - `northstar-clinical`: `878`
    - `skyharbor-air`: `3,240`
  - Mismatches: `[]`

## Rollout Plan

Merge to main so future Azure Search rebuilds use the corrected canonicalization and body-size guard. The live lab `tenant-context-v1` index has already been rebuilt from Azure Postgres by the one-time operator job.

## Rollback Plan

Revert this PR if the mapper behavior needs to be rolled back. To roll back the live Search index, rerun the prior backfill job from a known-good image, or recreate `tenant-context-v1` from Azure Postgres after restoring the previous mapper semantics. Do not re-enable Supabase fallback as a rollback path unless explicitly approved.

## Audit Evidence

- Azure deployment: `az-search-canonical-rebuild-20260606193458`
- Azure Container Apps execution: `job-a24-search-canon-eus-ac5kk3z`
- Container log events:
  - `azure_search_index_deleted`
  - `azure_search_indexes_verified`
  - `azure_search_canonical_batch_uploaded`
  - `azure_search_canonical_rebuild_verified`
- Unit-test command output from local run.

## Known Gaps

This release rebuilds Azure Search and fixes the mapper. It does not pause or delete Supabase, remove production fallback environment variables, or complete the final off-platform Supabase backup.
