# Lakeshore Enterprise Context — Proof Index (2026-06-06)

Master, **truthful** proof for `LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1`. The five load states are
tracked separately, as required.

| State                                        | Status      | Evidence                                                                                 |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| 1. Local generated                           | ✅ VERIFIED | 133 files + ZIP + manifest in this folder                                                |
| 2. Azure-staged (Blob)                       | ✅ VERIFIED | 133 blobs / 1,935,745 bytes in `context-drops`                                           |
| 3. DB-committed (Postgres)                   | ✅ VERIFIED | 5,247 chunks in `enterprise_context_chunks`                                              |
| 4. Indexed / searchable (AI Search + vector) | ✅ VERIFIED | 5,247 docs in `tenant-context-v1`, 1536-d vectors                                        |
| 5. Signed-in QA                              | ⚠️ PARTIAL  | Tenant-scoped retrieval QA executed live; **browser/Clerk UI QA not executed (blocked)** |

---

## 1. Files generated

- **133** synthetic source documents across 12 enterprise domains (+ `00_manifest`).
- File types: xlsx 71 · docx 24 · pdf 17 · csv 8 · md 5 · svg 7 · jsonl 1.
- High-volume corpora: **1,600** ServiceNow incidents, **1,200** ITSM events, **320** report rows,
  **140** rate-card rows, **120** risk/control + 120 app-inventory rows, **60** AI use cases.
- 7 **technical architecture SVGs** (enterprise, integration, Kyriba connectivity, data platform,
  zero-trust security, AI reference, roadmap) rendered to PNG in `screenshots/`.
- Root artifacts: `manifest.json`, `evidence_register.csv`, `data_dictionary.xlsx`,
  `README_LOAD_NOTES.md`. Every file carries the SYNTHETIC watermark + loader metadata
  (context_domain, source_owner, source_system, source_date, sensitivity, synthetic_flag,
  evidence_usable_flag, loader_route).
- Parse validation (real loader parser): **133/133 parsed, 0 failures**, 711,705 chars
  (`..._PARSE_REPORT.md`).

## 2. Files uploaded (Azure-staged)

- **133/133** original files uploaded to Azure Blob, **0 failures**, **1,935,745 bytes**.

## 3. Azure Blob storage location

```
account:   stabarvaprivatedplab001
container: context-drops
prefix:    lakeshore-holdings/LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1/
auth:      managed identity id-abarva-scale-runtime-lab-eastus (Storage Blob Data Contributor)
```

Detail: `..._AZURE_BLOB_RECEIPT.md`.

## 4. Parse success/failure counts

- Loader run inside Azure: **133 parsed OK, 0 failed**, 5,247 chunks produced (xlsx per-row,
  csv per-row, jsonl per-record, pdf/docx/md/svg text-chunked).
- Offline pre-validation (`..._PARSE_REPORT.md`): 133/133, 0 failures.

## 5. Azure DB row / chunk counts

- `enterprise_context_chunks`: **5,247** rows (`tenant_key='lakeshore-holdings'`,
  `client_id=49fc8aee-…`), **all embedded** (1536-d), across **133** distinct source files.
- `data_ingestion_runs`: audit row `source_label=LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1`,
  `chunks_loaded=5247`, `status=completed`.
- By domain: servicenow 3051 · data_analytics 575 · risk 374 · vendors 312 · it 267 · treasury 161 ·
  ai 150 · org 116 · strategy 95 · finance 65 · profile 47 · manifest 19 · operations 15.
- Independent re-query confirmed: total 5247, embedded 5247, dim 1536. Detail: `..._AZURE_DB_RECEIPT.md`.

## 6. Vector / search counts

- Azure AI Search `tenant-context-v1`: **5,247** docs uploaded (mergeOrUpload), **0 failed**;
  1,934 stale tenant docs purged for consistency; tenant docs after load = **5,247** (verified);
  index total 13,505 (multi-tenant).
- Each doc has BM25 `body` text + 1536-d `embedding` vector. Detail: `..._SEARCH_VECTOR_RECEIPT.md`.

## 7. Evidence citation examples

| Query / claim                             | Top evidence (domain)                  | Search score |
| ----------------------------------------- | -------------------------------------- | ------------ |
| Kyriba treasury bank connectivity rollout | 05_treasury_kyriba (1,022 hits)        | 27.6         |
| ServiceNow incident root cause            | 09_servicenow_support_workload (3,033) | 29.0         |
| SOX controls payment fraud                | 11_risk_controls_responsible_ai (475)  | 34.8         |
| AMS contract rate card optimization       | 10_vendors_contracts_source (580)      | 23.3         |
| reporting rationalization value           | 12_ai_use_cases_moves (911)            | 17.9         |

Chunk id pattern: `LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1::source/<domain>/<file>::<idx>`, each with
`provenance.blob_path` → the Azure Blob original.

## 8. Signed-in QA — questions & answers

Five tenant-scoped questions (treasury/Kyriba, ITSM root cause, reporting rationalization, SOX/fraud,
AMS optimization) were answered with domain-aligned, cited evidence — executed live against the same
`tenant-context-v1` index and Postgres the signed-in product reads, filtered to the Lakeshore tenant.
Full Q&A: `LAKESHORE_SIGNED_IN_QA_REPORT_2026-06-06.md` + `signed-in-qa/tenant_qa_results.json`.

**Not yet done:** authenticated browser (Clerk) clickthrough — blocked by missing Clerk credentials
in this environment; ready-to-run procedure documented.

## 9. What the context layer can now answer

Enterprise profile/operating model; org & decision rights; strategy/portfolio/RAID; finance P&L /
working capital / KPIs / value pools; **treasury & Kyriba** (rollout, connectivity, payments,
controls, defects); IT estate & architecture (with technical diagrams); data/analytics/reporting
estate; O2C/P2P/R2R operations; **1,600 ServiceNow incidents + 1,200 events**;
vendors/contracts/rate-cards/sourcing/BAFO; risk/controls/audit/Responsible AI; AI use-case
portfolio & value model. A board-grade flagship Move is produced from this context
(`LAKESHORE_FLAGSHIP_MOVE_KYRIBA_ENTERPRISE_MODERNIZATION_2026-06-06.md`).

## 10. What still needs hardening

1. **Browser signed-in product QA** (Clerk creds + reachable app) — the only unverified load state.
2. **Hybrid/vector retrieval** in the production retriever (vectors are indexed; retriever issues
   BM25 today — enable `vectorQueries`).
3. **Embedding provider policy** — used OpenAI directly via KV `openai-api-key`; align to platform
   standard if different.
4. **Dedicated Lakeshore pilot plane** — this load targeted the shared lab control plane
   (`abarva_control` + `srch-abarva-context-lab-eastus` + `stabarvaprivatedplab001`), the same place
   existing tenants live; promoting to `pglakeshorepilotlsh001` / `srchlakeshorepilotlsh001` requires
   connectivity into the Lakeshore pilot VNet (currently isolated from the lab worker).
5. **Container Apps Job path** — SP has `containerApps/*` but not `jobs/*` and cannot assign the
   privileged UAMI; the load therefore ran by repurposing an existing MI-bearing container app
   (`ca-abarva-scale-smoke-lab-eastus`, since restored). For repeatable ops, grant the SP
   `Microsoft.App/jobs/*` + `Managed Identity Operator`, or bake the loader into an ACR image (SP
   currently lacks AcrPush).
6. **Synthetic baselines** — replace with client-validated actuals at P2 Discover & Diagnose.

---

## How the load was executed (truthful method)

The private Azure data plane is firewalled from Cursor Cloud (Blob/Search 403; Postgres private
endpoint unresolvable; KV blocked). The repo `abarva-platform/abarva` is **public**, so the loader
(`scripts/lakeshore/azure-context-loader.cjs`) was run **inside the Azure VNet** via the
VNet-integrated container app `ca-abarva-scale-smoke-lab-eastus` (managed identity
`id-abarva-scale-runtime-lab-eastus`). The worker fetched the pack from the public branch, then
performed Blob upload → parse → Postgres commit → OpenAI embeddings → Azure AI Search indexing →
retrieval QA, all against the native Azure data plane. The repurposed app was **restored** to its
original state after the load. Raw run + verify evidence:
`azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json`,
`azure-load-receipts/LAKESHORE_VERIFY_2026-06-06.json`,
`azure-load-receipts/LAKESHORE_AZURE_MANAGEMENT_PLANE_STATS_2026-06-06.md`.
