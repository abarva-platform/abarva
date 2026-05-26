# Packet 24 — Multi-Tenant Substrate Loader (the actual fix for PACKET_23)

**Status:** Draft 2026-05-26. EXECUTING NOW (option (a) selected). CXO-demo gate.
**Companion to:** `PACKET_23_DB_SUBSTRATE_GAP_AUDIT.md` (the finding).
**Why this exists:** the 2026-05-26 substrate audit revealed 2,741 rows missing across all four composite tenants. The Northstar CXO demo cannot fire without the 720-chunk corpus being loaded + embedded. This packet specifies the loader; we ship + execute.

---

## Goal

A parameterized loader script that ingests a synthetic tenant's `datasets/<tenant>-synthetic-v1/` files into Supabase, producing:

1. `enterprise_context_source_files` rows (one per source file in the dataset)
2. `enterprise_context_chunks` rows with **real embeddings via the AI Egress Control Plane** (`embedPatternText`)
3. `applications` rows (application portfolio)
4. `ai_initiatives` rows (active + closed initiatives)
5. `vendor_contracts` rows
6. Evidence-ledger rows linking source files → committed rows (best-effort; some FK shapes are tenant-specific)

Plus a verification step that re-runs `db-substrate-audit.mjs` and exits nonzero if any tenant's row count is below the spec.

## Invocation

```bash
TENANT_KEY=northstar npm run substrate:load            # apply, all tables
TENANT_KEY=northstar npm run substrate:load -- --dry-run
TENANT_KEY=northstar npm run substrate:load -- --only-chunks   # corpus + source files only (the highest-leverage path)
```

Idempotent: re-running upserts by stable IDs (chunk_id, source_id, application name, initiative_id) — never duplicates rows.

## Phase priorities (run order)

Loading is broken into phases to fail safely:

1. **PHASE 1 — `enterprise_context_source_files`** (small, fast, no embedding). 96 rows for Northstar.
2. **PHASE 2 — `enterprise_context_chunks`** (largest, slowest, MOST IMPORTANT). 720 rows for Northstar. Each chunk:
   a. INSERT row with `embedding_status='pending'`, source_file_id linked.
   b. Call `embedPatternText({ text, clientId, ... })` — routes through AI Egress.
   c. UPDATE row with `embedding`, `embedding_dim`, `embedding_model`, `embedded_at`, `embedding_status='embedded'`.
   d. On failure: `embedding_status='failed'`, `embedding_error=<msg>`.
3. **PHASE 3 — `applications`** — 240 rows for Northstar. Pure insert/upsert, no embedding.
4. **PHASE 4 — `ai_initiatives`** — 80 active + 25 closed = 105 rows for Northstar. Need to map `primary_category_id` to existing category rows; fall back to NULL if no match (loader logs warning, doesn't fail).
5. **PHASE 5 — `vendor_contracts`** — 90 rows for Northstar. Dates as ISO, JSONB clauses as objects.

A `--only-chunks` flag runs only PHASES 1+2. That's the demo-critical path — without those, Sentinel can't ground. The other phases are nice-to-have for tower/source-module surfaces.

## Schema mapping per file

For Northstar (`datasets/northstar-clinical-tech-synthetic-v1/`):

| Phase | File(s) | Target table | Key mapping |
|---|---|---|---|
| 1 | `16-market-corpus/source-files/*.md` (96 files) | `enterprise_context_source_files` | `source_id` = filename stem (NST-SRC-001); `source_file` = filename; `source_path` = relative dataset path; `source_system` = 'northstar-corpus'; first-line of file → `workbook_name`; `file_hash` = sha256; `confidence` = 0.9; `freshness_status` = 'fresh' |
| 2 | `16-market-corpus/client-data-corpus.jsonl` (720 lines) | `enterprise_context_chunks` | `chunk_id` from JSONL; `source_file_id` linked to source row by source_id; `chunk_text` synthesized from claim+evidence_basis+do_not_overclaim_notes; `provenance` = full JSON; `chunk_metadata` = {industry, use_case, pattern_id, tenant_applicability}; `embedding_status` = 'pending' until embedded |
| 3 | `07-application-portfolio/application-portfolio.csv` (240 rows) | `applications` | per-column map; `client_id` = Northstar UUID; `is_demo_data` = true |
| 4 | `10-initiatives/initiatives-active.csv` + `initiatives-closed.csv` (105 rows) | `ai_initiatives` | `initiative_id` from CSV; `display_id` = same; `stage` mapped to canonical enum; FKs left NULL if no match |
| 5 | `09-vendors-contracts/vendor-contracts.csv` (90 rows) | `vendor_contracts` | `vendor_name`, `contract_name`, `annual_contract_value_usd`, dates, etc. |

## Embedding strategy

`enterprise_context_chunks.embedding` is `vector(3072)` (per `EMBEDDING_DIMENSIONS` in `src/lib/corpus/embedding.ts`). The loader calls `embedPatternText` for each chunk. This:

- Routes through `callModel` (AI Egress Control Plane)
- Writes `ai_egress_audit` row per call (provenance preserved)
- Honors tenant policy from `clients.ai_policy` JSONB
- Uses Azure OpenAI deployment `text-embedding-3-large`
- ~720 chunks × 1 call each ≈ 720 audit rows
- Cost estimate: ~$1.50 in Azure embedding fees (4M tokens × ~$0.13/1M)

Failure mode: if any chunk's embedding fails, the row is left at `embedding_status='failed'` with the error captured. Loader continues; verification step counts these.

Concurrency: 8 in-flight at a time (configurable via `--concurrency`). Tested empirically; Azure rate limits permit it for text-embedding-3-large at our quota.

## Idempotency

- `enterprise_context_source_files`: upsert by `(client_id, source_id)`
- `enterprise_context_chunks`: upsert by `(client_id, chunk_id)`. If chunk text changed → re-embed; else preserve existing embedding (skip re-embed cost).
- `applications`: upsert by `(client_id, name)` — applications are named uniquely per tenant.
- `ai_initiatives`: upsert by `(client_id, initiative_id)`.
- `vendor_contracts`: upsert by `(client_id, contract_name)`.

Re-running the loader is safe. Aborting mid-run + re-running picks up where it left off (rows with `embedding_status='pending'` are re-embedded; everything else skipped).

## Verification step (auto-run at end)

Loader concludes by:

1. Running `node scripts/audit/db-substrate-audit.mjs` for the tenant
2. Exits nonzero if any phase's row count is below 80% of the spec target (gives some slack for embedding failures + intentional dataset trims).

User can also re-run the audit standalone any time.

## Packet 25 — Provenance UI live-data binding (paired)

After the loader runs, `/admin/context-layer/*` must read from real Supabase rows instead of `northstar-read-model.ts`. Specifically:

1. **`/admin/context-layer/page.tsx`** — replace `NORTHSTAR_INGESTION_STAGES` with a server-side query that computes stages from `enterprise_context_source_files` row count, `enterprise_context_chunks` embedding statuses, and `ai_egress_audit` workflow filter for `embed-pattern`. Render the same UI shape.

2. **`/admin/context-layer/uploads/page.tsx`** — replace the hardcoded 3-row sample CSV demo with a server-side query listing the actual `enterprise_context_source_files` rows (paginated; show file_hash, row_count, last_synced_at, confidence). Add a link to each file's evidence map.

3. **`/admin/context-layer/syncs/page.tsx`** — show `ai_egress_audit` rows where `workflow='embed-pattern'` for the active tenant, grouped by source_file_id. Each row: call timestamp, model, status, audit_id (click-through to ai_egress detail).

4. **`/admin/context-layer/evidence-map/page.tsx`** — for each source file, show the set of committed chunks (chunk_id, chunk_text excerpt, embedding_status, embedded_at).

5. **`/admin/context-layer/approval-queue/page.tsx`** — wire to the actual `approval_queue` library state (if Supabase-persisted; otherwise show an empty state with a clear "no staged items" message).

Multi-tenant: every page resolves the active tenant via the existing `getActiveClientRow()` helper. No hardcoded `NORTHSTAR_*` references.

The `northstar-read-model.ts` file becomes `tenant-context-read-model.ts` and exports parameterized helpers:
```ts
export async function getTenantContextSummary(clientId: string): Promise<TenantContextSummary>;
export async function getTenantIngestionStages(clientId: string): Promise<IngestionStageRow[]>;
```

Hardcoded mock values are **removed entirely**. The CXO walkthrough shows real numbers tied to the loader's actual work.

## Auto-fix authority

User pre-approved "run non stop. auto commit and deploy." This packet executes:

1. Build the loader (this PR).
2. Run loader against Northstar (700+ embedding calls).
3. Verify substrate audit.
4. Re-run Northstar stress test → expect substantive answers, zero `sentinel_synthesis_misconfigured` flags.
5. If verification passes: ship Packet 25 UI rebinding.
6. Loop for Meridian + First Capital + Apex-delta.

Each step is its own PR with auto-merge on green.

## Out of scope (for this packet only)

- Embeddings model migration — sticking with `text-embedding-3-large` (3072 dims), no changes to the embedding stack itself.
- `applications` join tables and FK enrichment — loading flat columns is sufficient for the demo; rich joins (apps → integration topology, apps → AI tools) are Packet 26.
- Substrate-generated test fixtures — separate.
