# 2026-06-20-scb-w2-pgvector-retrieval — SCB W2 Pgvector Retrieval

## Release ID

`2026-06-20-scb-w2-pgvector-retrieval`

## Status

`live-proven`

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
- `src/lib/integrations/ai-egress/tenant-client-resolver.ts`
- `src/lib/integrations/ai-egress/tenant-policy.ts`
- `src/lib/admin/broker/egress-audit-writer.ts`
- `src/lib/integrations/ai-egress/__tests__/tenant-client-resolver.test.ts`
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
- PASS: signed-in crawl run 27899817521 proved `/api/context/demo` returns
  `Vector retrieval via Postgres pgvector`, 5 semantic chunks, positive top
  score `0.6340142761601872`, top tenant `apex-retail`, and zero warnings.
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
- ADDED: AI egress tenant-resolution fix. A VNet app-module probe showed the
  broker query embedding was blocked before OpenAI by
  `AI egress audit write failed: invalid input syntax for type uuid:
  "apex-retail"`. The policy/audit path now resolves dashed tenant keys and
  legacy app keys (`apex-retail`/`apexretail`, `first-capital`/`arcturus`,
  etc.) to `clients.id` before writing `ai_egress_audit`.

## Rollout Plan

Merged and deployed through the repo-owned ACA main deploy workflow. The
private VNet migration/backfill proof is complete, and signed-in retrieval QA
passed for Apex Retail via the post-deploy `context-demo` crawl. The signed-in
proof can be rerun on demand with the post-deploy crawl `context-demo` surface;
it is kept out of the default full crawl to avoid adding OpenAI/vector cost to
every normal deploy.

## Deployment Authority

- Repo-owned deploy workflow: run 27899542749 succeeded for merge commit
  `c88d149cd5da80a5ef90ea5cbf49190158f042a7`.
- Shared runtime mutators: none outside normal migration/deploy path.
- Approved image digest:
  `sha256:c2f4f17f8917ac21eb3d0598fe50948950313aabf70f1b69235ec77a1f19ae58`.
- ACA runtime invariant: revision `mc88d149c` healthy at 100% traffic; template
  image and live revision image matched; health endpoint OK.
- Worker image invariant: worker jobs updated by deploy workflow before traffic
  shift.
- Feature/env flag update path: none.
- Live signed-in proof required: complete via post-deploy crawl run 27899817521.

## Rollback Plan

Application rollback: revert the code change to restore keyword fallback when
the pgvector path is unavailable. Database rollback should not drop the
`embedding_vector` column immediately; leave it inert for audit/rollback safety.
If a destructive rollback is explicitly approved later, drop the HNSW/tenant
indexes and then the column in each affected schema.

## Audit Evidence

- PRs #3731, #3776, #3777, and #3778.
- Deploy run 27899542749.
- Signed-in crawl run 27899817521.
- Focused Jest output listed above.
- VNet migration output proving extension, column, and index creation.
- Signed-in answer/retrieval proof showing pgvector info tag and cited tenant
  chunk:
  `transcripts/apex-cdo__context-demo.context-demo-vector.json`.
- On-demand crawl artifact:
  `transcripts/<persona>__context-demo.context-demo-vector.json`.

## Known Gaps

None for W2.2 acceptance. Broader SCB rollout work continues in W1.4, W4.1/W4.2,
W5.1, W5.3, and W6.1.
