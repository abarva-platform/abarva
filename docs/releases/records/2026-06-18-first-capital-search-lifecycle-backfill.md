# 2026-06-18-first-capital-search-lifecycle-backfill — Fix A: First Capital Azure Search `lifecycle_state` rebuild + backfill

## Release ID

`2026-06-18-first-capital-search-lifecycle-backfill`

## Status

`applied` (data-plane operation — no code change, no PR)

## Plain-English Summary

The First Capital (`arcturus` / `first-capital`) Azure AI Search index `tenant-context-v1`
predated the `lifecycle_state` field added to the retriever's strict filter (PR #3399).
Live generations failed with `azure_search_query_failed: 400 — Could not find a property
named 'lifecycle_state' on type 'search.document'`. Fix B (PR #3685) made the retriever
degrade past the missing field as a resilience net; **Fix A** is the required data-plane
follow-up that rebuilds the index contract and repopulates the documents so retrieval runs
on the **strict**, fully-scoped path again (Fix B remains as the safety net).

This was executed entirely via in-VNet ACA jobs because the search service
`srch-abarva-context-lab-eastus` is private (`publicNetworkAccess: Disabled`).

## Layer Impact

- **`client-data-lane`** — First Capital private search index only. No schema/migration in
  Postgres, no app/control-plane code change. Additive index field + idempotent document
  upsert.

## Client Applicability

- **Specific clients: First Capital only** (`TENANT_KEY=arcturus`). No other tenant touched.
- All clients: No. Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

Operations, not code. Run from current image `acrabarvalab001.azurecr.io/abarva/web:main-8f35a2a4` via VNet jobs:

1. **Index-ensure apply** (`job-a24-search-verify-eus-xth6tv8`, Succeeded) —
   `src/scripts/azure-ai-search-indexes.ts apply`. Added the contract fields (incl.
   `lifecycle_state`) to `tenant-context-v1`. Log: `azure_search_index_applied {index:
   tenant-context-v1}` + `azure_search_indexes_verified`.
2. **Backfill apply, scoped arcturus** (`job-a24-search-backfill-eus-6kufp7y`, Succeeded) —
   `src/scripts/azure-ai-search-backfill.ts apply` with `TENANT_KEY=arcturus`. Re-upserted
   First Capital chunks via `@search.action: upload` (upsert; no deletes of other tenants).
   Logs: batches `uploaded` 500→1000→1500→2000→**2227**, then
   `azure_search_backfill_verified {observed:{first-capital:2227}}`.

> **Important:** used `azure-ai-search-backfill.ts` (which maps `lifecycle_state`), NOT the
> canon-rebuild job whose inline mapping omits `lifecycle_state` (a naive canon rerun would
> have reintroduced the gap).

## QA / Validation

Reported per the context-ingestion truth standard — each state separately:

- **PASS — Index field present**: `azure_search_index_applied` + `azure_search_indexes_verified`
  for `tenant-context-v1` (exec `xth6tv8`).
- **PASS — Documents committed**: 2,227 First Capital docs upserted; self-verify
  `observed.first-capital = 2227` (exec `6kufp7y`).
- **PASS — Independent re-verify**: standalone `azure-ai-search-backfill.ts verify` run
  (`job-a24-search-backfill-eus-t21fs0k`, Succeeded) → `azure_search_backfill_verified
  {observed:{first-capital:2227}}`.
- **PASS — Strict-filter value match (structural proof)**: the backfill selects only
  `coalesce(lifecycle_state,'active')='active'` chunks and stamps the uploaded doc's
  `lifecycle_state` to `'active'` (azure-ai-search-backfill.ts:154,173). The retriever's
  strict clause is exactly `lifecycle_state eq 'active'`
  (tenant-context-retriever.ts:206). All 2,227 docs therefore match the strict query — no
  silent-empty risk.
- **PASS — live signed-in generation rerun on the strict path** (2026-06-19): enqueued a
  fresh P1 Charter on move `b359859f` (run `6dd7183f-e546-42d1-9238-b4492cb4f42e`). KEDA
  worker claimed it (`tenant=arcturus, module=moves`) → `done · processed=1`, run
  `succeeded`, artifact `5afb4b3e-3131-4374-82c8-800ae2d9732e`, download HTTP 200, real DOCX
  51,616 bytes. **Across the whole run window there was NO `azure_search_index_drift`, no
  `degraded_index_contract`, no `azure_search_query_failed`, no `lifecycle_state` error** —
  i.e. the retriever ran the strict, fully-scoped path (pre-Fix-A = hard 400; post-Fix-B =
  success-with-drift-event; now = success-with-no-drift). End-to-end confirmed.

## Rollout Plan

Already applied to the live private index (operation, not a deploy). Idempotent: re-running
`backfill apply` re-upserts the same active set; `index apply` is a no-op once fields exist.

## Rollback Plan

The `lifecycle_state` field is additive — no rollback needed. If retrieval regressed, Fix B
(PR #3685) automatically degrades past any field issue, so there is no hard dependency on
this operation for availability. To revert document content, re-run the canon/backfill from
the source `enterprise_context_chunks` (the system of record is Postgres, unchanged here).

## Audit Evidence

- VNet job execution IDs: index apply `job-a24-search-verify-eus-xth6tv8`; backfill apply
  `job-a24-search-backfill-eus-6kufp7y`; re-verify `job-a24-search-backfill-eus-t21fs0k`
  (all Succeeded).
- Log Analytics workspace `03910a48-cca5-483b-a4b6-c576a2ecfaa9`, table
  `ContainerAppConsoleLogs_CL` — events quoted above.
- Image `main-8f35a2a4`. Tenant scope `arcturus` / `first-capital` only.
- Operator jobs left in read-only resting modes afterward: `verify-eus` → `indexes.ts plan`,
  `backfill-eus` → `backfill.ts verify` (so an accidental trigger cannot mutate).

## Known Gaps

- Observed during the verify run (UNRELATED to Fix A, parallel workload): a burst of
  `ai_egress_audit.tenant_mismatch {workflow: embed-pattern, provider: openai-embeddings,
  intended_tenant: meridian-health, resolved_tenant: 6e419b6e-…, policy_decision: allow}` on
  the shared worker env. Not from the First Capital charter run, but a meridian-health
  embed-pattern intended-vs-resolved tenant mismatch worth a separate look.
- `degraded_index_contract` (Fix B telemetry) is still not persisted onto deliverable_run /
  artifact metadata — so a future drift would be visible only in retriever telemetry, not in
  the run record.
- Other tenants' indexes were not audited for the same drift; if any other tenant predates
  PR #3399, it relies on the Fix-B degrade path until similarly backfilled.
