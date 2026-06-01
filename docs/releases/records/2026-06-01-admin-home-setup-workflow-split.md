# 2026-06-01-admin-home-setup-workflow-split — Admin Home And Setup Workflow Split

## Release ID

`2026-06-01-admin-home-setup-workflow-split`

## Status

`candidate`

## Plain-English Summary

This change separates the admin home page from the data-load operations page. Home now reads as a read-only review of what AbarVa knows about the active client. Setup/Data Loads now shows where operators actually load files, how those files move through scan, quarantine, validation, approval, and commit controls, and which controls are real UI routes versus monitored private data-plane contracts.

## Layer Impact

- `global-control-lane`: Updates shared admin navigation meaning and page composition for all clients.
- `client-data-lane`: Exposes existing client-scoped data-load, quarantine, approval, and commit-control paths in the Setup Data Load Center without adding a new database migration.

## Client Applicability

- All clients: yes, the admin Home and Setup page split applies globally.
- Specific clients: Apex Retail Group, Meridian Health, and SkyHarbor Air receive the clarified pilot data-load workflow through the same runtime page.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/page.tsx` reframes Home as a read-only system review page and points operators to Data Loads for upload/process controls.
- `src/components/admin/SetupDataLoadCenter.tsx` embeds the existing CSV loader and adds a workflow/control panel for upload, private worker processing, quarantine review, validation, approval, and commit/rollback.
- `src/lib/admin/setup-data-load-center.ts` adds a workflow-control read model using existing routes and contracts only.
- `src/app/(maestro)/admin/__tests__/page-source.test.ts` locks Home as read-only review.
- `src/app/(maestro)/admin/setup/__tests__/page-source.test.ts` locks Setup as the operational load/process page and prevents all-client manifest cards from returning to the runtime canvas.
- `src/lib/admin/__tests__/setup-data-load-center.test.ts` validates the workflow-control model.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/admin/__tests__/setup-data-load-center.test.ts "src/app/(maestro)/admin/setup/__tests__/page-source.test.ts" "src/app/(maestro)/admin/__tests__/page-source.test.ts" --runInBand` — 3 suites / 11 tests passed.
- PASS: `npx eslint src/app/'(maestro)'/admin/page.tsx src/app/'(maestro)'/admin/__tests__/page-source.test.ts src/app/'(maestro)'/admin/setup/__tests__/page-source.test.ts src/components/admin/SetupDataLoadCenter.tsx src/lib/admin/setup-data-load-center.ts src/lib/admin/__tests__/setup-data-load-center.test.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge to `main` after CI is green. Vercel production deployment activates the page copy and Setup workflow-control changes automatically. No migration, feature flag, or environment-variable change is required.

## Rollback Plan

Revert the PR to restore the prior Home copy and Setup Data Load Center layout. No database rollback is required because this release does not mutate data-plane schema or persisted records.

## Audit Evidence

- Pull request URL after opening.
- Local QA command output listed above.
- GitHub CI checks after PR creation.
- Production post-deploy crawl after merge.

## Known Gaps

The commit/rollback and landing-zone worker controls are surfaced honestly as monitored private data-plane contracts. This release does not add a new one-click commit endpoint or Azure worker trigger UI.
