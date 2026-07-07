# Admin Bulk Ingestion — End-to-End (WS-C) — 2026-06-09

The governed Admin bulk path is the single way client/pilot data enters, and the
same path synthetic reference tenants use. WS-C confirms it end-to-end and proves
WS-B idempotency through the real loader.

## The governed path (already implemented; WS-C confirms it)

`client downloads dimension template` → fills → uploads loose files via the
governed Admin route (`/api/admin/context-layer/{csv-upload,bulk-upload}`;
manifest-driven multi-file; **ZIP is already supported** by `bulk-upload`) →
template/schema validation → parse → **commit current facts** (idempotent
supersede, WS-B) → **chunks** (content-stable id + upsert, WS-B) → index (async
embed job → Azure AI Search) → citation/evidence objects → rows become
**`promotion_candidate`** → the governed promotion workflow (WS-F) decides
**`agent_ready`**. Upload never mints `agent_ready` directly.

Loader entrypoint: `loadCsvUploadToTenantContext` (`src/lib/context-ingestion/csv-upload-connector.ts`)
→ `promoteAdminStructuredRowsToEnterpriseContext` (facts) + chunk upsert.

## ZIP contract (honest)

`bulk-upload` already unpacks a ZIP (≤25MB, 5MB/file) with a `manifest.json`.
Loose multi-file manifest upload is also supported. No new ZIP claim is made
here — the existing path is confirmed, not reinvented.

## End-to-end smoke (real loader, idempotency)

`src/scripts/qa/admin-bulk-ingestion-smoke.ts` runs the **real**
`loadCsvUploadToTenantContext` with a canonical Vendors & Contracts template
payload, TWICE, and reports each ingestion state separately (parsed → committed
facts → chunks). The second run must commit the **same** logical facts/chunks —
no duplicates — proving WS-B supersede + the partial unique active-fact index +
content-stable chunk upsert hold through the governed path.

### Live ACA result

Run in-VNet via an Azure Container Apps job (private Postgres + KV secrets).
Results captured from the job logs are appended below after the run:

**Execution `job-ws-cde-eus-3e9w5bc` → Succeeded.** Two identical uploads of a
canonical Vendors & Contracts payload through `loadCsvUploadToTenantContext`:

| run | rowsParsed | recordsCommitted | factsCommitted | chunksUpserted |
|-----|-----------:|-----------------:|---------------:|---------------:|
| 1 | 2 | 2 | 10 | 2 |
| 2 | 2 | 2 | 10 | 2 |

`states={parsed:true, committed:true, chunked:true}`, **`idempotent: true`** —
the second identical upload committed the SAME 10 facts / 2 chunks, zero
duplication. WS-B supersede + the partial unique active-fact index +
content-stable chunk upsert hold end-to-end through the governed Admin path on
the live private DB.

## States reported separately (truth standard)

The smoke reports: **parsed** · **committed** (facts in `enterprise_context_facts`,
`lifecycle_state=active`) · **chunked** (rows in `enterprise_context_chunks`).
Index refresh is the async embed job; `promotion_candidate` eligibility is the
WS-F evaluator; `agent_ready` is the governed promotion. "Loaded" ≠ "indexed" ≠
"retrievable" ≠ "cited" — each is a distinct state.
