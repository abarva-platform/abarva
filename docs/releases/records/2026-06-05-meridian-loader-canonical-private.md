# 2026-06-05-meridian-loader-canonical-private — Meridian Loader Canonical Tenant + Private Chunk Target

## Release ID

`2026-06-05-meridian-loader-canonical-private`

## Status

`candidate`

## Plain-English Summary

Meridian enterprise-context uploads can now be parsed from the Day One package, retargeted to the production tenant key `meridian-health`, and loaded into the context stores that the live app actually reads. The structured loader also records an ingestion audit row, and the chunk loader can write to Meridian's private retrieval schema.

## Layer Impact

`client-data-lane`: This changes the governed ingestion path for Meridian context data. It does not add seed data or bypass the loader; it hardens the loader so a generated package can be committed under the canonical production tenant key.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health.
- Internal only: Admin/operator loader scripts.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-context/ingestion/meridian-loader.ts` adds a retarget helper for alias packages.
- `src/scripts/enterprise-context/load-enterprise-context.ts` supports `meridian-health` and writes `data_ingestion_runs` audit evidence.
- `src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts` supports `--tenant` and `--schema` for public and private chunk loads.
- `src/lib/enterprise-context/__tests__/meridian-ingestion-plan.test.ts` covers canonical retargeting.

## QA / Validation

- `npx jest src/lib/enterprise-context/__tests__/meridian-ingestion-plan.test.ts src/lib/enterprise-context/__tests__/chunking.test.ts --runInBand` — passed.
- `npx tsx src/scripts/enterprise-context/load-enterprise-context.ts --tenant=meridian-health --source docs/enterprise-context/generated/meridian-vnext` — dry-run passed with 3,503 records, 38,640 facts, 820 relationships, and 3,503 evidence rows.
- `npx tsx src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts --tenant=meridian-health --source=docs/enterprise-context/generated/meridian-vnext` — public chunk dry-run passed with 3,503 chunks.
- `npx tsx src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts --tenant=meridian-health --schema=client_meridian_health_private --source=docs/enterprise-context/generated/meridian-vnext` — private chunk dry-run passed with 3,503 chunks.

## Rollout Plan

Merge to main. Then run the Meridian reset/reload using the loader-backed scripts against the approved vNext package, writing structured context to public enterprise-context tables and searchable chunks to both public and Meridian private retrieval tables.

## Rollback Plan

Revert the PR to remove the loader enhancements. Any committed Meridian context data remains auditable through `data_ingestion_runs` and can be rolled back with a controlled tenant-scoped cleanup using the recorded loader run IDs.

## Audit Evidence

- PR URL and CI checks.
- `data_ingestion_runs` rows from the structured and chunk loads.
- Before/after tenant-scoped row counts for Meridian.

## Known Gaps

The private Meridian schema currently has retrieval/chunk tables but not the newer fact/evidence tables. Structured fact/evidence records therefore load to the shared tenant-scoped enterprise-context tables; private retrieval is covered by loading chunks into `client_meridian_health_private.enterprise_context_chunks`.
