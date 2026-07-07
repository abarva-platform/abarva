# 2026-06-18-first-capital-context-engine-p1-loader - Manifest Loader Extensions

## Release ID

`2026-06-18-first-capital-context-engine-p1-loader`

## Status

`candidate`

## Plain-English Summary

This release turns the First Capital V2 context templates into a governed loader path. It adds reusable template definitions, dimension-family metadata propagation, real context batch commits for YAML/profile loads, JSONL graph edge loading, Azure Blob staging for preserved originals, and a manifest-driven admin route that can load the base 19 dimensions plus the AI Control Tower supplement in the required order.

## Layer Impact

`client-data-lane`: Extends tenant-scoped context ingestion, source-file lineage, enterprise context records/facts/chunks, and graph relationships. The changes are generic and reusable across tenants, with First Capital V2 as the first target dataset.

`internal-admin`: Adds an admin-only manifest load endpoint for governed operator-driven loads from checked-in dataset folders. The route is tenancy-checked and restricted to paths under `datasets/`.

## Client Applicability

- All clients: Receive the reusable template IDs, dimension-family model, blob-staging utility, and manifest-load mechanics.
- Specific clients: First Capital Financial uses this path immediately for V2 demo data and AI Control Tower supplement loading.
- Internal only: Manifest route is admin/operator-facing.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Rewrites `src/lib/context-ingestion/context-commit.ts` into a real batch writer for source, source file, records, facts, chunks, and ingestion-run receipts.
- Adds `src/lib/context-ingestion/yaml-loader.ts` for enterprise profile YAML parsing.
- Adds `src/lib/context-ingestion/jsonl-graph-loader.ts` for `enterprise_context_relationships` edge writes after records are committed.
- Adds `src/lib/context-ingestion/blob-stager.ts` for `context-drops` Azure Blob preservation with graceful no-config fallback.
- Adds `src/app/api/admin/context-layer/manifest-load/route.ts` for manifest-driven loads.
- Raises the structured CSV/JSON/YAML row cap from 2,000 to 50,000.
- Adds direct `js-yaml` dependency and types.
- Adds First Capital V2 and Tower supplement template definitions.
- Propagates `dimension_family`, `domain_segment`, `load_order`, and Blob lineage through the structured promotion path.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npx jest src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts --runInBand` - 20 tests passed.
- Pass: First Capital V2 manifest parse smoke verified 29 load entries, 1 YAML profile, 413 CSV rows, and 151 graph edges.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Blocked: `npm run test:integration -- --runInBand` fails on existing broad-suite baselines unrelated to this loader slice, including admin visual-lock expectations, build-wave manifest expectations, shell topbar auth expectations, and meridian tenant-tier expectations. The focused context-ingestion tests above passed.
- Not run: Azure/Postgres live commit and ACA load job; Phase 1 adds the loader path but does not run the VNet data load.

## Rollout Plan

Merge after local validation and CI pass. Phase 2 will use this loader from an ACA job inside the VNet to truncate and reload the First Capital tenant-scoped context rows, then run golden-question smoke tests. No live data commit is performed by this PR alone.

## Rollback Plan

Revert the PR to remove the manifest route, loader utilities, template definitions, and row-cap change. If data was loaded later by Phase 2, use the tenant-scoped delete order in the handoff before reverting loader behavior.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Typecheck: Local pass.
- Focused context-ingestion tests: Local pass, 20 tests.
- Manifest parse smoke: Local pass, 29 entries / 413 CSV rows / 151 graph edges.
- Broad integration suite: Local blocked by unrelated baseline failures.
- ACA load receipt: Out of scope for Phase 1.

## Known Gaps

Phase 1 does not itself run the First Capital ACA seed job, refresh embeddings, or prove live signed-in retrieval. Those states remain Phase 2 through Phase 4 work.
