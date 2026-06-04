# 2026-06-04-corpus-attach-empty-vector-fallback — Corpus Attach Empty Vector Fallback

## Release ID

`2026-06-04-corpus-attach-empty-vector-fallback`

## Status

`candidate`

## Plain-English Summary

This change tightens the context broker attachment path so an empty vector retrieval result does not silently detach tenant corpus chunks. When the vector backend returns zero tenant chunks, the broker now falls back to keyword chunk retrieval and marks the existing vector-pending warning.

## Layer Impact

- `global-control-lane`: Updates shared context-broker retrieval behavior used by tenant-grounded agent context assembly. No schema, Azure infrastructure, tenant data, or UI changes are included.

## Client Applicability

- All clients: tenant-grounded broker calls now keep a keyword-backed chunk attachment when vector retrieval returns no hits.
- Specific clients: Lakeshore benefits directly because its Postgres corpus chunks are live and embedded, while Pinecone vector upsert/retrieval is not proven.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/knowledge/context-broker/broker.ts`: Treats empty vector results as an attach miss and falls back to keyword chunks.
- `src/lib/knowledge/context-broker/__tests__/broker.test.ts`: Adds regression coverage for empty vector fallback.
- `src/lib/knowledge/context-broker/__tests__/broker-azure-search-dispatch.test.ts`: Keeps the Azure-failure-to-pgvector dispatch test on a real pgvector hit rather than an empty result.

## QA / Validation

- `npx jest src/lib/knowledge/context-broker/__tests__/broker.test.ts src/lib/knowledge/context-broker/__tests__/broker-azure-search-dispatch.test.ts --runInBand` — passed.

## Rollout Plan

Merge to `main`; Vercel deployment picks up the safer broker fallback with no manual runtime steps.

## Rollback Plan

Revert the PR. No data or migration rollback is required.

## Audit Evidence

- Release record: `docs/releases/records/2026-06-04-corpus-attach-empty-vector-fallback.md`
- Focused broker tests listed in QA / Validation.

## Known Gaps

This does not prove Pinecone upsert for Lakeshore. It makes the broker honest and useful when Pinecone or Azure vector retrieval returns no tenant hits by preserving Postgres keyword-backed chunk attachment.
