# 2026-06-02-home-admin-reload-readiness — Home/Admin Reload Readiness

## Release ID

`2026-06-02-home-admin-reload-readiness`

## Status

`candidate`

## Plain-English Summary

Admin Data Load Center now makes the client reload path explicit: the page shows the active-client-only boundary, the governed reload command plan, the Azure/system handoffs, the required checks, the approval/notification path, and the controlled-exception metadata required when a client uploads a file that does not match a standard template.

## Layer Impact

- `global-control-lane`: Updates the shared Admin control-plane read model and Admin page presentation. No tenant data is loaded and no Azure mutation path is introduced.

## Client Applicability

- All clients: yes, for Admin users on the active-client Admin workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/admin/setup-data-load-center.ts`
- `src/components/admin/SetupDataLoadCenter.tsx`
- `src/lib/admin/__tests__/setup-data-load-center.test.ts`
- `src/app/(maestro)/admin/setup/__tests__/page-source.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/setup-data-load-center.test.ts --runInBand`
- PASS: `npx jest --runTestsByPath 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' --runInBand`
- PASS: `npx eslint src/lib/admin/setup-data-load-center.ts src/components/admin/SetupDataLoadCenter.tsx src/lib/admin/__tests__/setup-data-load-center.test.ts 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts'`
- PASS: `git diff --check`
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked in the local linked install because `@axe-core/playwright` is declared in `package.json` but absent from `node_modules`, causing `tests/accessibility/public-axe.spec.ts` to fail module resolution before changed files are typechecked.
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`; Vercel deploy updates the Admin Data Load Center. No migration, live Azure provisioning, or feature flag is required for this read-model/UI release.

## Rollback Plan

Revert the PR to return the Admin Data Load Center to the previous read model and presentation.

## Audit Evidence

PR URL and CI checks will be attached after opening the PR.

## Known Gaps

This release does not perform live Azure Blob upload, Azure Document Intelligence parsing, durable queue execution, or database/search commit. It makes the active-client reload workflow visible and test-guarded so the implementation can proceed without ambiguity.
