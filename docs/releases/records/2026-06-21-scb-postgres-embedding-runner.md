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
- PASS: Private VNet DB proof `job-abarva-private-operator-eus-gnxyv7q` confirmed pgvector extension `0.8.2`, `enterprise_context_chunks.embedding_vector` type `vector`, HNSW index `idx_enterprise_context_chunks_embedding_vector_hnsw`, and zero embedded rows missing vectors across all six tenants.
- PASS: The same VNet proof ran a tenant-scoped vector-distance query with `<=>` and returned ranked Apex Retail chunks from `F17_ai-automation-footprint.csv` and `F13_initiatives-portfolio.csv`.
- PENDING: signed-in retrieval proof that the app/broker path cites a chunk via the vector path.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, then run the private Container Apps job with `--postgres-only` to backfill vectors for chunks that are currently marked `embedded` but have `embedding_vector IS NULL`.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime image availability.
- Shared runtime mutators: no direct ACA mutation in this PR.
- Approved image digest: produced by main deploy.
- ACA runtime invariant: required after main deploy.
- Worker image invariant: required after main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, retrieval proof should show a cited chunk from pgvector after backfill. The database/index layer is proven; browser/API citation proof remains pending.

## Rollback Plan

Revert the script change. Existing database columns and vectors are left intact; retrieval still falls back to keyword if vectors are absent.

## Audit Evidence

- PR #3731 merged to main.
- Private proof: VNet job `job-abarva-private-operator-eus-gnxyv7q` proved `pgvector` extension/column/index live and all embedded chunks vectorized across six tenants.
- Vector query proof: VNet job `job-abarva-private-operator-eus-gnxyv7q` returned tenant-scoped ranked chunks with the pgvector `<=>` operator.

## Known Gaps

The database/index/vectorization layer is proven live. Remaining gap is the signed-in app/broker proof that a user-visible retrieval cites a chunk via the vector path.
