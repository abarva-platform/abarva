# 2026-06-03-tower-outcome-export-downloads — Tower Outcome Export Downloads

## Release ID

`2026-06-03-tower-outcome-export-downloads`

## Status

`candidate`

## Plain-English Summary

Fixes the Control Tower outcome-report download path so same-client admin users
can download DOCX and XLSX reports even when the Tower page resolved the client
from the explicit `client` query parameter instead of an active-client cookie.
The route still blocks cross-client export attempts and continues to stream
downloadable Office files with attachment headers.

## Layer Impact

- Release lane: `global-control-lane`.
- Control Tower export route: updates the authorization fallback for
  `/api/v1/tower/outcome-report` and adds route tests for DOCX/XLSX download
  behavior plus same-client isolation.

## Client Applicability

- All clients: the route behavior applies to all Tower outcome-report downloads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/tower/outcome-report/route.ts`
- `src/app/api/v1/tower/outcome-report/__tests__/route.test.ts`

## QA / Validation

- PASS: `npx jest src/app/api/v1/tower/outcome-report/__tests__/route.test.ts --runInBand`
- PASS: `npx jest src/lib/tower/exports/__tests__/outcome-report.test.ts src/app/api/v1/tower/outcome-report/__tests__/route.test.ts --runInBand`
- PASS: `npx eslint src/app/api/v1/tower/outcome-report/route.ts src/app/api/v1/tower/outcome-report/__tests__/route.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check origin/main...HEAD`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected main merge queue. The fix becomes active with the
next application deploy from `main`; no migration or manual data operation is
required.

## Rollback Plan

Revert the PR to restore the prior strict active-tenancy-only export behavior.
No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2952.
- CI: pending at PR open.
- Local QA: focused Tower route/render tests, eslint, TypeScript, whitespace
  check, and release control passed before PR.

## Known Gaps

This change validates the route contract locally. T355 should stay `In progress`
until the deployed Tower UI is retested and DOCX/XLSX clicks are proven to
download files in the target environment.
