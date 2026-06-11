# 2026-06-11-context-search-lineage-hardening — Context Search Lineage Hardening

## Release ID

`2026-06-11-context-search-lineage-hardening`

## Status

`candidate`

## Plain-English Summary

Closes the post-remediation context-health gaps that prevented the Azure Search layer from proving tenant identity and current-only retrieval. Tenant context Search documents now carry `client_id`, `client_key`, `lifecycle_state`, source basis/citation, confidence level, classification, readiness status, and source-row hints. The Search backfill indexes only active chunks and deletes non-active chunk documents. Direct Admin CSV uploads now stage the original file to Azure Blob before parsing and committing context, matching the governed bulk-upload process.

## Layer Impact

- `client-data-lane`: Adds an additive lifecycle column to `enterprise_context_chunks`, changes the Search backfill contract, and hardens Admin structured upload lineage.
- `global-control-lane`: Tightens the shared Azure Search retriever so agent retrieval filters `lifecycle_state = 'active'`.
- `internal-admin`: Direct `/api/admin/context-layer/csv-upload` now preserves original uploaded bytes in the governed `context-uploads` container before context commit.

## Client Applicability

- All clients: Yes, all tenant context Search indexing and direct Admin CSV upload flows.
- Specific clients: Health-check/deploy verification focuses on SkyHarbor Air, Lakeshore Holdings, Apex Retail, and Meridian Health.
- Internal only: Operator/admin upload and data-plane maintenance path.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `supabase/migrations/20260611130000_enterprise_context_chunk_lifecycle.sql`
- `src/lib/azure-search/index-contracts.ts`
- `src/lib/azure-search/tenant-context-backfill.ts`
- `src/scripts/azure-ai-search-backfill.ts`
- `src/lib/azure-search/tenant-context-retriever.ts`
- `src/app/api/admin/context-layer/csv-upload/route.ts`
- `src/lib/context-ingestion/csv-upload-connector.ts`
- `src/lib/context-ingestion/admin-structured-context-promotion.ts`
- `supabase/migrations/20260610203000_source_artifacts.sql` compatibility hardening so live Azure environments with the older Source artifact registry can add the newer File Cabinet metadata contract without rebuilding the table.
- Focused unit/route tests for Search contracts, Search mapping, retriever filters, CSV connector, and direct CSV route.

## QA / Validation

- PASS: `npx jest src/lib/azure-search/__tests__/index-contracts.test.ts src/lib/azure-search/__tests__/tenant-context-backfill.test.ts src/lib/azure-search/__tests__/retriever-parity.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand` (39/39 tests; existing duplicate manual mock warnings only).
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `node scripts/release-check.mjs`
- PENDING: ACA migration job, Azure Search index apply/backfill, ACA app deploy, and post-deploy context health-check rerun.

## Rollout Plan

Build an Azure ACR image from this branch. Temporarily point the approved ACA operator job at the image, run `npm run db:migrate` to apply the additive lifecycle migration, run the Azure Search index apply/backfill inside the VNet, restore the operator job to its baseline image/command/env, deploy the same image to the ACA web app by pinned digest, then rerun the client context health check for the four reference clients.

## Rollback Plan

Rollback app behavior by shifting ACA web traffic back to the prior revision. Search index rollback is to rerun the previous Search backfill image/contract. The migration is additive; the safest rollback is to leave `enterprise_context_chunks.lifecycle_state` in place with default `active`. If a hard rollback is required, drop the index/constraint/column only after confirming no deployed code depends on it.

## Audit Evidence

- Focused test output
- TypeScript/release/diff checks
- ACR image tag and digest
- ACA migration/search-backfill execution IDs and logs
- Restored operator job JSON
- Post-deploy health-check report under `docs/context/`

## Known Gaps

Historical Apex/Meridian source rows that cite older container-local paths may still need a separate lineage reconciliation job if their original source files were never staged to Blob. This release prevents new direct CSV uploads from creating that gap and exposes the Search metadata required for current-only retrieval proof.
