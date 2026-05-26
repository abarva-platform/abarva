# 2026-05-26-context-layer-live-data-binding - Context Layer Live Data Binding

## Release ID

`2026-05-26-context-layer-live-data-binding`

## Status

`candidate`

## Plain-English Summary

Replaces the context-layer admin mock data with tenant-scoped live reads from
Supabase. The operator pages now show the active client's source files,
embedding status, pending or failed chunks, egress audit history, and evidence
chunks from `enterprise_context_chunks` and `ai_egress_audit`.

## Layer Impact

- `app-control-lane`: `/admin/context-layer`, `/uploads`, `/syncs`,
  `/approval-queue`, and `/evidence-map` now render tenant-parameterized live
  data instead of a fixed demo read model.
- `client-data-lane`: reads the active client's `clients.id` as the filter key
  and does not fall back to cross-tenant data when no client row exists.
- `ai-egress-control-lane`: sync history uses `ai_egress_audit` rows written by
  the substrate embedding loader.
- `ops-release-lane`: adds focused unit coverage and a live read-only Northstar
  smoke target for the production substrate count.

## Client Applicability

- All clients: the context-layer admin pages now resolve the active client and
  show only rows scoped to that client's UUID.
- Northstar MedTech: live smoke verified 720 substrate chunks and 720 embedded
  chunks from production Supabase.
- Existing tenants with no loaded substrate: pages render honest empty states.

## Changes Included

- New tenant read model: `src/lib/context-ingestion/tenant-context-read-model.ts`
- Updated admin pages under `src/app/(maestro)/admin/context-layer/`
- Unit coverage:
  `src/lib/context-ingestion/__tests__/tenant-context-read-model.test.ts`
- Live smoke:
  `scripts/smoke/northstar-context-layer-live-data.spec.ts`
- Package script: `smoke:northstar-context-layer-live-data`

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/tenant-context-read-model.test.ts --runInBand`
- PASS: `npx eslint "src/app/(maestro)/admin/context-layer" src/lib/context-ingestion/tenant-context-read-model.ts src/lib/context-ingestion/__tests__/tenant-context-read-model.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run smoke:northstar-context-layer-live-data`
- PASS: live read-only check found Northstar MedTech with 720 context chunks and
  720 embedded chunks.

## Rollout Plan

Merge after CI is green. The change is read-only against tenant data and does
not mutate production rows. It applies immediately to the authenticated admin
context-layer routes.

## Rollback Plan

Revert this application commit to restore the previous static context-layer
pages. No database rollback is required because this release only reads existing
tables.

## Audit Evidence

- GitHub PR checks for the merge commit.
- Live smoke output from `npm run smoke:northstar-context-layer-live-data`.
- Unit test coverage for zero rows, status counts, source-file grouping,
  provider/model grouping, evidence filtering, embedding history, and pending
  chunk error rows.

## Known Gaps

- The upload form itself is still not a storage-backed file-upload workflow.
- `/admin/context-layer/templates` remains a template catalog page and is not
  part of this live-data binding slice.
