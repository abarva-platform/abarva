# Retail Overlay v1 Embedding Report

Generated: 2026-05-30T10:08:00Z

## Scope

- Tenant: `apex-retail`
- Overlay namespace: `retail-v1`
- Table: `public.enterprise_context_chunks`
- Embedding command: `EMBEDDING_BATCH_SIZE=256 EMBEDDING_MAX_BATCHES=24 npm run embed:pending-chunks -- --tenant apex-retail --postgres-only`
- Embedding model: `text-embedding-3-small`
- Embedding dimension: `1536`

## Embedding Run Summary

| Metric | Value |
| --- | ---: |
| Chunks embedded in run | 5,691 |
| Failed chunks | 0 |
| Skipped chunks | 0 |
| Batches run | 23 |
| Tokens used | 1,573,580 |
| Actual estimated cost | $0.031472 |
| Pinecone upserts | 0 |
| Pinecone failures | 0 |

## Live DB Integrity

| Check | Result |
| --- | ---: |
| Retail-v1 chunks loaded | 5,691 |
| Embedded chunks | 5,691 |
| Pending chunks | 0 |
| Failed chunks | 0 |
| Rows with `embedding_dim = 1536` | 5,691 |
| Distinct source packs | 301 |
| Distinct super-categories | 60 |
| Pattern chunks | 5,390 |
| Pack-synthesis chunks | 301 |
| Duplicate chunk IDs | 0 |
| Bad embedding shapes | 0 |

## Validation

- PASS: Section 6.1 requires at least 5,500 retail-overlay chunks; live DB has 5,691.
- PASS: Section 6.1 requires 100% embedding coverage; live DB has 5,691 embedded of 5,691.
- PASS: No pending or failed `retail-v1` chunks remain for `apex-retail`.
- PASS: Every live row has `embedding_dim = 1536` and a 1,536-length embedding array.
- PASS: Overlay rows are tenant-scoped to `apex-retail` through `tenant_key` and tagged with `chunk_metadata.overlay_namespace = retail-v1`.

## Operational Notes

The embedding job logged a primary Azure database DNS fallback for `pg-abarva-context-lab-001.postgres.database.azure.com`, then successfully used the configured fallback `DATABASE_URL`. This did not block reads or writes; all 5,691 overlay chunks reached embedded state.

The run intentionally used `--postgres-only`, so no Pinecone writes occurred. The loaded retrieval substrate is Azure Postgres `enterprise_context_chunks`, matching the live tenant context path.
