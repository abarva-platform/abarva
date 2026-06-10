# Context Layer — Schema & Pipeline Reference

_Technical map for probes, loads, indexing, promotion, and bundle proof. Authored 2026-06-10._

## Tables (migration `20260514100000_enterprise_context_layer.sql`; chunks from
`20260430121500_apex_setup_data_layer.sql` + `20260430130000_..._embedding.sql`)

All `enterprise_context_*` tables are scoped by **`tenant_key` (TEXT NOT NULL)** + **`client_id`
(UUID FK clients)**, RLS via `can_read_tenant_by_key` / `can_write_tenant_by_key`.

| Table | Identity key | Lifecycle | Notable cols |
|---|---|---|---|
| `enterprise_context_sources` | `(tenant_key, source_system, source_key)` | `source_status` | confidence, freshness_status, evidence_pointer |
| `enterprise_context_source_files` | `(tenant_key, source_file_id)` | — | source_id FK, source_path, file_hash, row_count |
| `enterprise_context_records` | `(tenant_key, canonical_record_id)` | `lifecycle_state{active,superseded,inactive}` + `superseded_by_record_id` | record_type(=template key), title, payload(JSONB), source_row_number |
| `enterprise_context_facts` | `(tenant_key, record_id, fact_key, value_hash)` | `lifecycle_state` + `supersedes_fact_id` | fact_type, fact_value(JSONB), fact_text, confidence, evidence_pointer, valid_from/through |
| `enterprise_context_chunks` | `(tenant_key, chunk_id)` | (via source record) | source_segment_id, chunk_text, embedding_status{pending,skipped,embedded,failed}, embedding(JSONB), provenance |

Supporting: `_relationships`, `_evidence` (citation links: citation_label/locator, evidence_usable),
`_quality_issues`, `_stewardship_tasks`, `_template_runs`, `_chunk_queue`.

## Tenant-key canonicalization (`20260515120000_tenant_key_canonicalization.sql`)
On read/write, `current_tenant_key()` CASE-maps short aliases → canonical:
`apexretail→apex-retail`, `meridian→meridian-health`, `arcturus→first-capital`.
**Implication:** target canonical tenant_keys are `apex-retail`, `meridian-health`, and
(to be confirmed in live DB) `lakeshore-holdings`. The probe enumerates ACTUAL distinct tenant_keys —
no assumptions.

## Loaders
- **Governed (use this):** `src/scripts/enterprise-context/load-enterprise-context.ts` +
  `src/lib/enterprise-context/ingestion/*-loader.ts`. Order: parse manifest+CSV → validate vs
  template → build plan (source, source_file, record per row, fact per column, relationships,
  evidence, quality issues, stewardship, chunk queue) → batched upserts on the keys above →
  supersede prior active facts/records.
- **Chunks-only (avoid for facts):** `scripts/seed/load-tenant-substrate.ts` (SkyHarbor's wired
  path) — useful only for the chunk corpus, not structured facts.

## Indexing — Azure AI Search index `tenant-context-v1`
(`src/lib/azure-search/index-contracts.ts`, `tenant-context-backfill.ts`). Fields incl.
`id`(base64url of tenant_key:chunk_id), **`tenant_key`(filterable — isolation)**, `source_segment`,
`record_id`, `chunk_id`, `title`, `body`, `source_uri`, `confidence`, `sensitivity`, `last_seen_at`,
`embedding`(1536-d, HNSW cosine). **Every query MUST `filter: tenant_key eq '<key>'`.** Only
`lifecycle_state='active'` facts/chunks index; superseded → `deactivate` op removes the doc.

## Retrieval — KNOWN GAP to watch
`src/lib/retrieval.ts` Azure SQL branch filters by `source_segment_id IN (...)` but **does not add a
`tenant_key` filter** → cross-tenant leak / zero-result risk depending on call site. This lane's
retrieval proof must verify tenant isolation explicitly and, if needed, remediate the filter.
Segment-gate also matters (only certain `source_segment_id` values are retrievable) — cf. memory
"retrieval segment gate."

## Promotion — `governed_object_readiness` + `src/lib/governance/promotion-evaluator.ts`
(EXISTS; PR-P1 merged. Live: ~59,753 rows, evidence columns largely unpopulated → all
`remain_not_reviewed`.) Gates for `agent_ready` (read-only evaluator `evaluatePromotion`):
active/current · source_basis · confidence_level · classification allowed · tenant-scoped ·
provenance present · indexed/retrievable · cited-render-verified · valid applicable_agents · no
duplicate active fact/search-doc. States: `not_reviewed → promotion_candidate → agent_ready`
(or `blocked`/`restricted`). Promotion **write path is PR-P2 (not yet merged)** — stamps
`promoted_at/by_job/reason`.

## Context bundle — `src/lib/agent/context-bundle.ts`
Contract is `ContextBundle` (8 categories: identity, workObject, workflowState, businessContext,
artifacts, patterns, evidence, conversation), with `responseGate` (permitsResponse,
requiresDisclosure, requiresRefusal, …) and `state ∈ {complete, usable_with_gaps, pattern_only,
insufficient, blocked}`. The lane's "ContextBundleTrace" is an emitted record we assemble around a
real retrieve→ground→answer call (trace_id, tenant, module, evidence_requirements_resolved,
current/superseded counts, citations_emitted, tenant_leakage_status, model_call_allowed, …).

## Private data plane access
Private Postgres / Azure AI Search / Blob are reachable **only via ACA/VNet jobs** (localhost
cannot reach them). Mechanism: patch `job-abarva-private-operator-eus` to run a base64-injected
tsx script with secrets wired (`/tmp/run_job.py` runbook), read results from Log Analytics via a
`___MARKER___` console line, then restore the operator job.
