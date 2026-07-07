# 2026-06-10-tenant-context-search-in-fix — Azure Search sensitivity filter hotfix

## Release ID

`2026-06-10-tenant-context-search-in-fix`

## Status

`candidate`

## Plain-English Summary

Fixes a latent bug in the tenant-context Azure AI Search retriever: when a caller passed
a `sensitivity` filter, the retriever built an OData `sensitivity in ('a','b')` clause,
which Azure AI Search rejects ("unsupported OData language feature"), returning a 400 and
surfacing as a 500. The new Deliverable Orchestrator surface is the first caller to pass a
`sensitivity` filter, so it tripped this. Switched to the supported `search.in()` function.

## Layer Impact

- `global-control-lane`: one-line filter-composition fix in
  `src/lib/azure-search/tenant-context-retriever.ts` (shared retrieval). No schema/data
  change. Behavior is identical for the (existing) callers that pass no `sensitivity`
  filter; the `sensitivity` path now emits valid OData.

## Client Applicability

- All clients: yes — any retrieval call that filters by sensitivity (currently the
  Deliverable Orchestrator's evidence assembler) now succeeds instead of 400-ing.

## Changes Included

- `src/lib/azure-search/tenant-context-retriever.ts` — `buildFilter` emits
  `search.in(sensitivity, 'a,b', ',')` instead of `sensitivity in ('a','b')`.
- `src/lib/azure-search/__tests__/retriever-parity.test.ts` — updated to assert the
  `search.in()` form and to forbid the unsupported `in (` form.

## QA / Validation

- `jest src/lib/azure-search/__tests__/retriever-parity.test.ts` → 14/14 pass.
- `tsc --noEmit` clean (file) · `eslint` clean.
- Root cause confirmed from production logs: `azure_search_query_failed:400 ... unsupported
  OData language feature. Parameter name: $filter` on `POST /api/v1/deliverables/generate`.

## Rollout Plan

Squash-merge to main → rebuild web image from main → roll `ca-abarva-web-lab-eastus` to a
new revision → shift 100% traffic. No migration.

## Rollback Plan

Revert the one-line change (restores the prior `in (...)` form). No data/schema to unwind.
Container-app traffic can be shifted back to the prior revision instantly.

## Known Gaps

- Other comparison/`in`-style filters in the same builder were reviewed; only the
  `sensitivity` clause used the unsupported list-literal operator. `tenant_key eq` and
  `confidence ge` are standard supported OData.

## Audit Evidence

Production log line (above), the updated parity test, and this record.
