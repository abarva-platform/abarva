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
- `src/lib/knowledge/tenant-data/__tests__/supabase-adapter.test.ts`
- `src/lib/crawl/persona-switcher.ts`
- `scripts/crawl/post-deploy-harness.ts`
- `scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Focused Jest coverage for embedding writes, pgvector retrieval, broker info
  tags, and Azure Search parity shape.

## QA / Validation

- PASS: `npm ci` in isolated worktree.
- PASS: `npm test -- --runTestsByPath src/scripts/__tests__/embed-pending-chunks.test.ts src/lib/knowledge/tenant-data/__tests__/supabase-adapter.test.ts src/lib/knowledge/context-broker/__tests__/broker.test.ts src/lib/azure-search/__tests__/retriever-parity.test.ts --runInBand`
  - Result: 4 suites passed, 106 tests passed, 9 skipped.
  - Note: Jest emitted pre-existing duplicate manual mock warnings for
    markdown/GFM mocks; they did not fail the run.
- PASS: Private VNet DB proof `job-abarva-private-operator-eus-gnxyv7q`
  confirmed pgvector extension `0.8.2`, native `embedding_vector` column,
  HNSW index, zero embedded rows missing vectors across six tenants, and a
  tenant-scoped `<=>` query returning ranked Apex chunks.
- PENDING: signed-in retrieval proof showing a chunk cited via pgvector path.
- ADDED: explicit post-deploy crawl surface `context-demo` that logs in, calls
  protected `/api/context/demo`, and fails unless the broker returns the
  Postgres pgvector info tag, semantic chunks, a positive vector score, and a
  tenant-matched top chunk.
- ADDED: pgvector private-schema fallback proof. Live signed-in probe showed
  Apex routed to `client_apex_retail_private.enterprise_context_chunks`, which
  does not exist yet, while public `enterprise_context_chunks` has 1656/1656
  Apex embedded vectors. `chunksByVector` now falls back to public pgvector rows
  on the same missing-private-schema class that keyword retrieval already
  handled.

## Rollout Plan

Merge after CI is green. Apply the migration inside the private VNet so every
existing schema with `enterprise_context_chunks` receives `embedding_vector` and
HNSW/tenant indexes. Re-run the embedding job with `--postgres-only` or the
normal path to populate `embedding_vector`, then run signed-in answer/retrieval
QA for at least one tenant before declaring W2.2 complete. The signed-in proof
can be run on demand with the post-deploy crawl `context-demo` surface; it is
kept out of the default full crawl to avoid adding OpenAI/vector cost to every
normal deploy.

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
- On-demand crawl artifact:
  `transcripts/<persona>__context-demo.context-demo-vector.json`.

## Known Gaps

Live extension/column/index proof is complete. Signed-in retrieval proof remains
pending until the `context-demo` crawl surface runs against the deployed app and
captures a pgvector-backed semantic chunk from the protected route.
