# 2026-06-03-moves-rate-card-data-load-validation — Moves Rate-Card Data Load Validation

## Release ID

`2026-06-03-moves-rate-card-data-load-validation`

## Status

`candidate`

## Plain-English Summary

Adds the first Data Loads wiring for Moves rate cards. Operators can select the internal rate,
vendor/SI rate, or geography modifier templates in the existing CSV upload control. The upload path
parses and validates the rows, returns row-level findings, and deliberately does not commit rate
cards to tenant data-plane tables yet.

## Layer Impact

- `global-control-lane`: Extends the admin CSV upload API and control with rate-card validation
  preview mode.
- `client-data-lane`: Tenant rate-card data can be validated, but no new tenant data-plane write
  path is introduced in this slice.

## Client Applicability

- All clients: Applies wherever the admin context upload route is available.
- Specific clients: None.
- Internal only: Admin/operator workflow until the commit slice lands.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/admin/context-layer/csv-upload/route.ts`
- `src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts`
- `src/components/admin/context-layer/CsvUploadConnector.tsx`

## QA / Validation

- `npx jest --runTestsByPath src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-row-parser.test.ts src/lib/programs/expert-kernel/rate-card/__tests__/rate-card-ingestion.test.ts --runInBand` — passed, 22 tests.
- `npx eslint src/app/api/admin/context-layer/csv-upload/route.ts src/app/api/admin/context-layer/csv-upload/__tests__/route.test.ts src/components/admin/context-layer/CsvUploadConnector.tsx` — passed.
- `npx tsc --noEmit --pretty false --incremental false` — passed after refreshing this worktree's dependencies with `npm ci` to pick up the current-main Azure Document Intelligence package.
- `npm run release:check -- --base origin/main --head HEAD` — passed.

## Rollout Plan

Merge to `main`. The route becomes available through the existing admin CSV upload control. Valid
rate-card uploads return validation-only status until the later commit/data-plane slice lands.

## Rollback Plan

Revert the PR. This removes the rate-card validation path and template options from the upload
control. No migrations or committed tenant rate-card data are involved.

## Audit Evidence

- PR URL: pending.
- Route tests prove cross-tenant protection remains intact, context CSV persistence still works, and
  rate-card uploads validate without database writes.

## Known Gaps

- Rate-card commit to tenant data-plane tables is still not implemented.
- Workbook/XLSX parsing is not yet wired; this slice validates CSV-style rows through the existing
  upload route.
- The upload page remains a shared context/rate-card control; a dedicated Apple-calm Rate Card Load
  Studio can be designed later if the workflow grows.
