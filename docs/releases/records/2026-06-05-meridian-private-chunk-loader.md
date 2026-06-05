# 2026-06-05-meridian-private-chunk-loader — Meridian Private Retrieval Chunk Loader

## Release ID

`2026-06-05-meridian-private-chunk-loader`

## Status

`candidate`

## Plain-English Summary

The Meridian enterprise-context chunk loader can now write approved context chunks into Meridian's private retrieval schema even when that schema is not exposed through the API client. This keeps the reload process governed by the loader while matching the private data plane that live agent retrieval uses.

## Layer Impact

`client-data-lane`: This affects the Meridian context reload path only. It does not introduce seed side-loads; it extends the loader-backed ingestion script so private schema writes are audited in the tenant's `data_ingestion_runs` table.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health.
- Internal only: Admin/operator loader script.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts` now uses a direct Postgres schema writer when `--schema` is provided.
- The private writer inserts and updates a tenant-scoped `data_ingestion_runs` row and upserts chunks by `(tenant_key, chunk_id)`.

## QA / Validation

- `npx jest src/lib/enterprise-context/__tests__/meridian-ingestion-plan.test.ts src/lib/enterprise-context/__tests__/chunking.test.ts --runInBand` — passed.
- `npx tsx src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts --tenant=meridian-health --schema=client_meridian_health_private --source=docs/enterprise-context/generated/meridian-vnext` — dry-run passed with 3,503 planned chunks.
- Scoped typecheck grep against touched enterprise-context files returned no touched-file errors.

## Rollout Plan

Merge to main. Then rerun the Meridian private chunk apply command as part of the approved context reset/reload:

`npx tsx src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts --tenant=meridian-health --schema=client_meridian_health_private --source=docs/enterprise-context/generated/meridian-vnext --apply`

## Rollback Plan

Revert the PR to remove the private schema writer. Any private chunk rows written by the loader are auditable through the private `data_ingestion_runs` row and can be removed with the recorded tenant-scoped reset script.

## Audit Evidence

- PR URL and CI checks.
- Private `data_ingestion_runs` row for the chunk apply.
- Before/after counts for `client_meridian_health_private.enterprise_context_chunks`.

## Known Gaps

The private schema still does not expose the newer fact/evidence tables; those remain in the shared tenant-scoped enterprise-context tables. This PR only addresses private retrieval chunks.
