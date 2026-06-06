# 2026-06-06-lakeshore-enterprise-context-load-v1 — Lakeshore Enterprise Context Load V1 + Flagship Kyriba Move

## Release ID

`2026-06-06-lakeshore-enterprise-context-load-v1`

## Status

`candidate`

## Plain-English Summary

Generates a fully **synthetic** enterprise transformation data room for Lakeshore Holdings
(`LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1` — 133 documents across 12 context domains, all watermarked
SYNTHETIC) and **loads it end-to-end into the native Azure data plane**: original files to Azure Blob,
parsed context chunks to Azure Postgres, embeddings + documents to Azure AI Search. Also adds the
generator, the Azure private-worker loader, a parse report, Blob/DB/Search receipts, a board-grade
flagship Kyriba modernization Move artifact, a signed-in QA report, and a truthful proof index. No
runtime application code changes — this is data-room build artifacts + scripts + a client-scoped data
load.

## Layer Impact

- **client-data-lane:** Lakeshore (`lakeshore-holdings`) context committed to the shared lab control
  plane (`abarva_control.enterprise_context_chunks`, Azure AI Search `tenant-context-v1`, Blob
  `context-drops`), isolated by `tenant_key`. No schema changes.
- **Build artifacts / docs:** new files under `docs/build/lakeshore-enterprise-context/` and
  `scripts/lakeshore/` (generator, loader, parse driver). No `src/` runtime changes.

## Client Applicability

- All clients: No
- Specific clients: Lakeshore (`lakeshore-holdings`) — synthetic data only
- Internal only: Yes (build artifacts + scripts)
- Public/demo only: No
- Feature flag: None

## Changes Included

- `scripts/lakeshore/generate-enterprise-context-pack.py` — synthetic pack generator (133 files,
  technical architecture SVGs, enriched docs).
- `scripts/lakeshore/azure-context-loader.cjs` — VNet private-worker loader (Blob → parse → Postgres
  chunks → OpenAI embeddings → Azure AI Search → retrieval QA).
- `scripts/lakeshore/parse-pack-headless.ts` — parse validation via the real loader parser.
- `docs/build/lakeshore-enterprise-context/**` — pack, ZIP, manifests, evidence register, data
  dictionary, receipts, flagship Move, proof index, QA report, diagrams, consolidated bundle.
- PR: #3224.

## QA / Validation

- Parse: 133/133 files parsed through `src/lib/ingestion/document-upload-parser.ts`, 0 failures.
- Live Azure load (verified): Blob 133 files / 1,935,745 bytes (0 failed); Postgres 5,247 chunks
  committed, all embedded (1536-d) + `data_ingestion_runs` audit row; Azure AI Search 5,247 docs
  (0 failed); independent read-only re-query confirmed total 5,247 / search tenant docs 5,247.
- Retrieval QA: 5 tenant-scoped queries returned domain-aligned, ranked results.
- Evidence: `docs/build/lakeshore-enterprise-context/azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json`,
  `LAKESHORE_VERIFY_2026-06-06.json`, and the three `..._RECEIPT.md` files.

## Rollout Plan

Merge to `main` via squash merge. No runtime deploy required (build artifacts + scripts). The Azure
data load already executed against the lab control plane; merging only publishes the artifacts and
tooling. The Container App used for the load (`ca-abarva-scale-smoke-lab-eastus`) was restored to its
original state.

## Rollback Plan

- Revert the merge commit to remove artifacts/scripts.
- To remove loaded data: `DELETE FROM enterprise_context_chunks WHERE chunk_id LIKE
'LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1::%'`; delete matching `tenant-context-v1` docs (filter
  `tenant_key eq 'lakeshore-holdings'`); delete the
  `context-drops/lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/` blob prefix.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3224
- Proof index: `docs/build/lakeshore-enterprise-context/LAKESHORE_ENTERPRISE_CONTEXT_PROOF_INDEX_2026-06-06.md`
- Management-plane stats: `docs/build/lakeshore-enterprise-context/azure-load-receipts/LAKESHORE_AZURE_MANAGEMENT_PLANE_STATS_2026-06-06.md`
- Run/verify JSON: `azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json`, `LAKESHORE_VERIFY_2026-06-06.json`

## Known Gaps

- Browser signed-in (Clerk) product QA not executed (no Clerk credentials in the agent environment);
  ready-to-run procedure documented in `LAKESHORE_SIGNED_IN_QA_REPORT_2026-06-06.md`.
- Production retriever issues BM25; vectors are indexed and ready for hybrid/vector queries.
- Embeddings used OpenAI directly via KV `openai-api-key`; align to platform embedding policy if different.
