# LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Search / Vector Receipt

**State: INDEXED-SEARCHABLE — VERIFIED.** All chunks are indexed in Azure AI Search with both
full-text (BM25) `body` content and 1536-dimension vectors, and are retrievable filtered to the
Lakeshore tenant.

## Search target

| Field                 | Value                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Service               | `srch-abarva-context-lab-eastus`                                                                      |
| Endpoint              | `https://srch-abarva-context-lab-eastus.search.windows.net`                                           |
| Index                 | `tenant-context-v1` (shared multi-tenant context index)                                               |
| Key field             | `id`                                                                                                  |
| Vector field          | `embedding` (Collection(Edm.Single), 1536-d, HNSW)                                                    |
| Text fields populated | `body`, `title`, `source_segment`, `record_id`, `chunk_id`, `tenant_key`, `source_uri`, `sensitivity` |
| Auth                  | AAD token via UAMI (`Search Index Data Contributor`)                                                  |
| Embeddings            | OpenAI `text-embedding-3-small` (key from KV `openai-api-key`)                                        |

## Index result (live)

| Metric                                                        | Value                                               |
| ------------------------------------------------------------- | --------------------------------------------------- |
| Documents uploaded (mergeOrUpload)                            | **5,247**                                           |
| Failed                                                        | **0**                                               |
| Stale tenant docs purged before reindex                       | 1,934 (delete-by-key paging; index left consistent) |
| Tenant docs after load (`tenant_key eq 'lakeshore-holdings'`) | **5,247** (independently verified)                  |
| Index total docs (all tenants)                                | 13,505                                              |

## Retrieval QA (live BM25 query, filtered `tenant_key eq 'lakeshore-holdings'`)

| Query                                       | Matches | Top hit domain                  | Top score |
| ------------------------------------------- | ------- | ------------------------------- | --------- |
| "Kyriba treasury bank connectivity rollout" | 1,022   | 05_treasury_kyriba              | 27.6      |
| "ServiceNow incident root cause"            | 3,033   | 09_servicenow_support_workload  | 29.0      |
| "reporting rationalization value"           | 911     | 12_ai_use_cases_moves           | 17.9      |
| "SOX controls payment fraud"                | 475     | 11_risk_controls_responsible_ai | 34.8      |
| "AMS contract rate card optimization"       | 580     | 10_vendors_contracts_source     | 23.3      |

Each query returned correctly-domain-aligned, ranked results — confirming the context layer is
searchable and tenant-scoped.

## Vector / hybrid notes

- Vectors (1536-d) are stored in both Postgres (`embedding` jsonb) and the AI Search `embedding`
  field, enabling hybrid (BM25 + vector) and pure-vector retrieval via the
  `tenant-context-v1` index used by the Context Broker / Sentinel / Nexus / Moves retrieval lane.
- The retriever currently issues BM25 text search; vector fields are populated and ready for
  vector/hybrid queries (`vectorQueries` against `embedding`).

Raw run evidence: `azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json`
(`load_run_steps.search`, `load_run_steps.qa.search`).
