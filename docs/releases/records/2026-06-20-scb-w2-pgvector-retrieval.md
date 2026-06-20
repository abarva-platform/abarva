# 2026-06-20-scb-w2-pgvector-retrieval — SCB W2 Pgvector Retrieval

## Release ID

`2026-06-20-scb-w2-pgvector-retrieval`

## Status

`candidate`

## Plain-English Summary

This change moves tenant-private semantic retrieval for the Shared Context Brain
from the optional Pinecone overlay to the Azure/Postgres context substrate. New
embeddings are now written to both the existing JSONB audit column and a native
`embedding_vector` pgvector column, and the broker's vector path reads tenant
chunks directly from Postgres before falling back to keyword retrieval.

## Layer Impact

- client-data-lane: adds pgvector storage/indexes on every existing
  `enterprise_context_chunks` table and changes tenant chunk semantic retrieval
  to query Postgres.
- global-control-lane: updates shared broker labels/types/tests so all answer
  surfaces consume the same database-first retrieval contract.
- experimental/legacy vector mirror: Pinecone upsert code remains optional for
  replay, but tenant-private retrieval no longer depends on Pinecone.

## Client Applicability

- All clients: yes, for tenants with `enterprise_context_chunks` and embedded
  chunk vectors after migration/backfill.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none for the repository path; rollout still requires private
  VNet migration/backfill proof before declaring live.

## Changes Included

- `supabase/migrations/20260620090000_enterprise_context_chunks_pgvector.sql`
- `src/scripts/embed-pending-chunks.ts`
- `src/lib/knowledge/tenant-data/supabase-adapter.ts`
- `src/lib/knowledge/tenant-data/adapter.ts`
- `src/lib/knowledge/tenant-data/types.ts`
- `src/lib/knowledge/context-broker/broker.ts`
- `src/lib/knowledge/context-broker/types.ts`
- Focused Jest coverage for embedding writes, pgvector retrieval, broker info
  tags, and Azure Search parity shape.

## QA / Validation

- PASS: `npm ci` in isolated worktree.
- PASS: `npm test -- --runTestsByPath src/scripts/__tests__/embed-pending-chunks.test.ts src/lib/knowledge/tenant-data/__tests__/supabase-adapter.test.ts src/lib/knowledge/context-broker/__tests__/broker.test.ts src/lib/azure-search/__tests__/retriever-parity.test.ts --runInBand`
  - Result: 4 suites passed, 106 tests passed, 9 skipped.
  - Note: Jest emitted pre-existing duplicate manual mock warnings for
    markdown/GFM mocks; they did not fail the run.
- PENDING: private VNet migration apply proof.
- PENDING: signed-in retrieval proof showing a chunk cited via pgvector path.

## Rollout Plan

Merge after CI is green. Apply the migration inside the private VNet so every
existing schema with `enterprise_context_chunks` receives `embedding_vector` and
HNSW/tenant indexes. Re-run the embedding job with `--postgres-only` or the
normal path to populate `embedding_vector`, then run signed-in answer/retrieval
QA for at least one tenant before declaring W2.2 complete.

## Deployment Authority

- Repo-owned deploy workflow: required before shared runtime use.
- Shared runtime mutators: none in this PR outside normal migration/deploy path.
- Approved image digest: to be captured after merge/deploy.
- ACA runtime invariant: unchanged by this repository-side candidate.
- Worker image invariant: embedding job image must be the deployed image that
  contains this script update before backfill.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before W2.2 can be marked done.

## Rollback Plan

Application rollback: revert the code change to restore keyword fallback when
the pgvector path is unavailable. Database rollback should not drop the
`embedding_vector` column immediately; leave it inert for audit/rollback safety.
If a destructive rollback is explicitly approved later, drop the HNSW/tenant
indexes and then the column in each affected schema.

## Audit Evidence

- PR URL and CI run after PR creation.
- Focused Jest output listed above.
- VNet migration output proving extension, column, and index creation.
- Signed-in answer/retrieval proof showing pgvector info tag and cited tenant
  chunk.

## Known Gaps

Live extension/column/index proof and signed-in retrieval proof are still
pending because those must run inside the private VNet, not from the laptop.
