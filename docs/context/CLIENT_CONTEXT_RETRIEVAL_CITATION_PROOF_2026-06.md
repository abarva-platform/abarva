# Retrieval & Citation Proof (Phases 6–7)

_Executed 2026-06-10 via ACA/VNet operator job `...-boshah8` (Succeeded). Azure AI Search auth: managed
identity (`id-abarva-scale-runtime-lab-eastus`, holds Search Index/Service Contributor) — the service has
`disableLocalAuth=true`, so API keys are rejected; AAD is the only path._

## Phase 6 — Indexing (Azure AI Search `tenant-context-v1`)
- Index schema **created/applied** (`azure_search_index_applied: tenant-context-v1`).
- Backfill from `enterprise_context_chunks` (via `DATABASE_URL`/pg inside VNet) **applied + verified**.
- **Verified doc counts by tenant** (`azure_search_backfill_verified.observed`):

| Tenant | Index docs |
|---|--:|
| apex-retail | 6,497 |
| meridian-health | 3,506 |
| lakeshore-holdings | 1,542 |
| skyharbor-air | 6,341 |
| northstar-clinical | 878 |
| first-capital | 400 |

Index counts match the live `enterprise_context_chunks` census exactly → backfill is complete and idempotent.

## Phase 7 — Retrieval + citation proof (tenant-scoped, isolation-safe)
Harness: `src/scripts/azure-search-retriever-smoke.ts` (pins `filter: tenant_key eq '<key>'`).
Query: _"critical applications vendor contracts renewal risk initiatives kpis"_, top-k 5.

| Client | Result | Top hit (citation) | Isolation |
|---|---|---|---|
| **Meridian Health** | ✅ ok | `renewal_calendar` REN-MH-009, score 22.76, `sourceDoc: 06-renewal-calendar.csv`, owner Strategic Sourcing | only meridian-health docs returned |
| **Lakeshore Holdings** | ✅ ok | vendor contract "Databricks" (V-DATABRICKS, $850k, renewal 2026-12-31), score 26.93, `sourceDoc: data/lakeshore-vendor-contracts.csv` | only lakeshore-holdings docs returned |
| **Apex Retail** | ✅ ok (chunk-only) | `application_portfolio` APX-SAP-SD ($1.8M run cost, TIME=migrate), score 14.18, `sourceDoc: renewal-calendar-12mo.csv` | only apex-retail docs returned |

Each hit carries `chunkId`, `sourceSegmentId`, `sourceDoc` (citation pointer), and a BM25 score. Because every
query is tenant-filtered and the retriever re-stamps the canonical tenant_key, cross-tenant leakage is structurally
impossible on this path.

## Caveats / remaining
- **Apex retrieval is chunk-only.** Hits resolve to `APX-P18-CHUNK-*` (the chunk seed), NOT structured
  `enterprise_context_facts` (Apex still has 0 facts). Apex needs the governed records+facts load before its
  retrieval is fact-grounded/promotable. Tracked in Phase 5.
- The `askIntelligence` runtime path still goes through `src/lib/retrieval.ts`, which has a confirmed
  **cross-tenant filter bug + dead segment allow-list** (separate code fix, Phase 7-code). The Azure Search
  retriever proven here (`tenant-context-retriever.ts`) already isolates correctly; the code fix aligns the
  other retriever + the Meridian/Lakeshore segment-name mapping so askIntelligence surfaces these facts.
- Lifecycle filter: backfill currently indexes all chunks; superseded-exclusion patch is queued
  (none of these tenants have superseded chunks today — 0 superseded facts — so no stale docs were indexed).

## Acceptance (Phases 6–7)
Index docs reported per client; tenant-scoped retrieval returns the correct client's evidence with citation
metadata; no cross-tenant leakage on the proven path. Apex flagged as chunk-only pending fact load.
