# 2026-06-18-first-capital-v2-load-receipt-table-tolerance - First Capital V2 Load Receipt Table Tolerance

## Release ID

`2026-06-18-first-capital-v2-load-receipt-table-tolerance`

## Status

`candidate`

## Plain-English Summary

This follow-up lets the First Capital V2 ACA load continue when the optional `data_ingestion_runs` receipt table is not present in the Azure/Postgres environment. The failed live ACA attempt proved the context tables were reachable, but tenant reset stopped before load because this optional audit table was treated as mandatory.

## Layer Impact

`client-data-lane`: Changes only context-ingestion load behavior. Context tables still fail closed on real write errors; only the absent optional receipt table is skipped.

## Client Applicability

- All clients: Context manifest loads can tolerate environments that do not yet have `data_ingestion_runs`.
- Specific clients: First Capital Financial V2 ACA seed job.
- Internal only: ACA/operator load path.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/jobs/load-first-capital-v2.ts`: skips tenant-scoped delete for `data_ingestion_runs` if the table does not exist.
- `src/lib/context-ingestion/context-commit.ts`: skips ingestion-run insert/update when that optional table does not exist, matching the existing CSV connector posture.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Not run yet: rebuilt seed image and second ACA/VNet load attempt.

## Rollout Plan

Merge after CI, rebuild `Dockerfile.seed` with a new tag, and rerun the ephemeral First Capital V2 ACA job. Capture the JSON receipt from logs.

## Rollback Plan

Revert this PR. No data-plane rows are changed by the code patch itself; only the ACA job execution mutates data.

## Audit Evidence

- Failed live execution: `fcf-v2-load-20260617200755-3ffj62w`.
- Failure reason: `first_capital_delete_failed:data_ingestion_runs:relation "data_ingestion_runs" does not exist`.
- PR URL: Pending.
- CI run: Pending.
- Second ACA load receipt: Pending.

## Known Gaps

This patch does not create the optional `data_ingestion_runs` table. It only prevents that missing receipt table from blocking the First Capital context load. Embeddings refresh and signed-in retrieval proof remain later phases after a successful ACA commit.
