# 2026-06-18-azure-search-lifecycle-drift-resilience — Retriever degrades past missing index field (lifecycle_state)

## Release ID

`2026-06-18-azure-search-lifecycle-drift-resilience`

## Status

`candidate`

## Plain-English Summary

Deliverable generation for First Capital was failing because the Azure Search evidence retriever filters results by `lifecycle_state eq 'active'` (added in PR #3399), but First Capital's live Azure Search index predates that field — so the search returned a 400 ("Could not find a property named 'lifecycle_state'") and the whole generation failed. This was masked while the worker ran a stale image and surfaced once the worker was brought to current `main` (the web/worker-drift fix).

This is **fix B**: make the retriever resilient to that specific index/contract drift instead of failing, **as a resilience fallback, not a silent semantic change**:

1. Try the strict filter first (`lifecycle_state eq 'active'` included).
2. If — and only if — Azure Search returns the **specific missing-`lifecycle_state`-field 400**, emit index-drift telemetry.
3. Retry once with **only** the `lifecycle_state` clause stripped.
4. Expose the degradation via a `degradedIndexContract` telemetry out-param and a `degraded_index_contract: true` telemetry log field.
5. **Tenant / program / client scope and all other filters stay pinned** — only the lifecycle clause is dropped, and only on that exact error. Any other failure still throws.

The proper fix (**A**, required follow-up below) is to rebuild First Capital's index so the data plane matches the current contract; this change keeps generation working through that drift and protects every tenant from future contract/index skew.

## Layer Impact

- **`global-control-lane`** — shared Azure Search retrieval behavior for all tenants. No schema/RLS/migration. No data write.

## Client Applicability

- All clients: **Yes** — shared retriever; the fallback only triggers on the specific missing-field error, so non-drifted indexes are unaffected (strict path unchanged).
- Specific clients: First Capital is the one currently drifted (others unaffected until/unless they drift). Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/lib/azure-search/tenant-context-retriever.ts`:
  - `LIFECYCLE_ACTIVE_CLAUSE` const + `stripLifecycleStateFilter()` (drops only that clause via split/rejoin on `" and "`, preserving every other clause).
  - `runSearchRequest`: strict → on the specific missing-`lifecycle_state` 400 only, warn-log `azure_search_index_drift` (`degraded_index_contract: true`) → retry once without the lifecycle clause; any other failure still throws.
  - `TenantContextQueryInput.telemetry?` out-param + `markDegraded()` wired into all search calls (sets `degradedIndexContract = true`).
- `src/lib/azure-search/__tests__/retriever-parity.test.ts`: degrade regression (keeps tenant scope, flags telemetry) + generic-failure-still-throws.

## QA / Validation

- **PASS** — `eslint` + `tsc --noEmit` on changed files (0 errors).
- **PASS** — `jest src/lib/azure-search/__tests__` → 38 tests (36 existing parity/contract + 2 new degrade); strict-filter parity unchanged.
- **NOT-RUN (pending deploy)** — re-run the failed acceptance tail on the same fresh move (`b359859f`): P1 generate → event worker → File Cabinet artifact → download. To attach before `released`.

## Rollout Plan

Merge to `main` → `aca-main-deploy` (web + both worker jobs via the worker-deploy step). No migration. The retriever degrade takes effect for the worker immediately.

## Rollback Plan

Revert the PR and redeploy prior `main`. No data impact. (Reverting re-introduces the generation failure until fix A lands.)

## Audit Evidence

- PR URL (added on open) for `fix/azure-search-lifecycle-drift`; CI run; the deliverable_run error that motivated it (`azure_search_query_failed:400 … lifecycle_state`) on move `b359859f`; post-deploy generate→artifact→download proof.

## Known Gaps

- **REQUIRED: rebuild/backfill First Capital's Azure Search index to include `lifecycle_state`** so the live index matches the current contract (`index-contracts.ts`) and the retriever runs the strict (non-degraded) path again. Until then, FC retrieval runs in degraded mode (one extra failed strict request per search + lifecycle freshness not filtered at the index — superseded chunks may be retrieved). Use the tenant-context backfill/re-index path (`src/lib/azure-search/tenant-context-backfill.ts`). Tracked as a data-plane follow-up; this resilience change is the interim unblock, not the cure.
- The `degradedIndexContract` flag is exposed to callers but not yet persisted onto the deliverable_run/artifact metadata (the orchestrator does not pass `telemetry` yet) — a small wiring follow-up; the telemetry log is the canonical record in the meantime.
