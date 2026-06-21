# 2026-06-21-scb-postgres-embedding-runner — Azure-Native Embedding Runner

## Release ID

`2026-06-21-scb-postgres-embedding-runner`

## Status

`candidate`

## Plain-English Summary

The pending-chunk embedding script can now run in the private Azure runtime with only `DATABASE_URL` and `OPENAI_API_KEY` when `--postgres-only` is used. This removes the accidental dependency on Supabase compatibility env vars for the pgvector path.

## Layer Impact

`client-data-lane`: changes the operational embedding/backfill path for `enterprise_context_chunks` so vectors can be written directly to Azure PostgreSQL/pgvector.

## Client Applicability

- All clients: applies to every tenant whose context chunks are embedded through the shared script.
- Specific clients: none.
- Internal only: operator-run script behavior.
- Public/demo only: no.
- Feature flag: no runtime feature flag; command remains explicit via `--postgres-only`.

## Changes Included

- `src/scripts/embed-pending-chunks.ts`

## QA / Validation

- PASS: `npx jest src/scripts/__tests__/embed-pending-chunks.test.ts --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npx eslint src/scripts/embed-pending-chunks.ts`
- NOT-RUN: private VNet run with `npm run embed:pending-chunks -- --postgres-only`; requires this change to be deployed in the ACA image first.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then run the private Container Apps job with `--postgres-only` to backfill vectors for chunks that are currently marked `embedded` but have `embedding_vector IS NULL`.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime image availability.
- Shared runtime mutators: no direct ACA mutation in this PR.
- Approved image digest: produced by main deploy.
- ACA runtime invariant: required after main deploy.
- Worker image invariant: required after main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, retrieval proof should show a cited chunk from pgvector after backfill.

## Rollback Plan

Revert the script change. Existing database columns and vectors are left intact; retrieval still falls back to keyword if vectors are absent.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Private proof: prior VNet job proved `pgvector` extension/column live and exposed 878 `embedded` rows with null vectors before this fix.

## Known Gaps

This PR fixes the runner path. It does not itself backfill the existing 878 null-vector rows until the updated image is deployed and the private job is run.
