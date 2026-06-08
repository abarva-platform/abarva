# 2026-06-08-enterprise-context-source-id-default — Enterprise Context Source ID Drift Repair

## Release ID

`2026-06-08-enterprise-context-source-id-default`

## Status

`candidate`

## Plain-English Summary

This release fixes the live Enterprise Context source-table drift found during
the Lakeshore structured-load backfill. `enterprise_context_sources.id` was
missing its UUID default in Azure, so the Admin structured promotion failed when
it tried to upsert a source row. The writer now supplies deterministic source
and source-file IDs, and a small migration restores the database default.

## Layer Impact

- `client-data-lane`: hardens Enterprise Context source/source-file lineage for
  Admin structured loads.
- `internal-admin`: unblocks the Lakeshore Admin bulk-load structured promotion
  backfill.
- `global-control-lane`: adds an idempotent schema-drift repair migration.

## Client Applicability

- All clients with Admin structured context uploads.
- Immediate validation target: Lakeshore Holdings job
  `bulk-0af5b2dc5f80801f`.

## Changes Included

- Admin structured promotion now writes stable UUIDs for
  `enterprise_context_sources.id` and `enterprise_context_source_files.id`.
- `enterprise_context_source_files.source_id` is set to the promoted source row.
- New idempotent migration restores the default on
  `enterprise_context_sources.id`.

## QA / Validation

- PASS — Targeted Jest:
  `npx jest src/lib/context-ingestion/__tests__/admin-structured-context-promotion.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand`.
- PASS — ESLint on touched TypeScript source/test files.
- PASS — `npx tsc --noEmit --pretty false`.
- PASS — `git diff --check`.
- PASS after this record update — `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED until merge/deploy — Azure migration apply and Lakeshore backfill rerun.

## Rollout Plan

1. Merge to `main`.
2. Build/deploy the Azure Container Apps image from merged `main`.
3. Apply the new migration to Azure Postgres.
4. Rerun the Lakeshore structured promotion backfill.
5. Verify promoted source, source-file, record, and fact counts.

## Rollback Plan

Revert the PR and redeploy the prior image. The migration is additive and
safe to leave in place; it only restores the table default to the original
Enterprise Context DDL behavior.

## Audit Evidence

- Failed operator job log:
  `enterprise_context_sources upsert: null value in column "id"`.
- Follow-up PR checks.
- Post-rerun structured-promotion Blob receipt.

## Known Gaps

- This does not change the semantics of structured promotion beyond source
  lineage and ID/default repair.
- This does not run embeddings or Azure Search refresh; those remain separate
  retrieval-readiness stages.
- The Lakeshore backfill must be rerun after the migration/image are live.
