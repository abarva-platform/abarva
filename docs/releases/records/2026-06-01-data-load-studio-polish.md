# 2026-06-01-data-load-studio-polish — Setup Data Load Studio Polish

## Release ID

`2026-06-01-data-load-studio-polish`

## Status

`candidate`

## Plain-English Summary

The Setup page now presents a dimension-first Data Load Studio instead of leading with a raw CSV form. Maestros see which business dimensions can be loaded, which formats and templates are available, what is complete, and which governed workflow step comes next before opening a real upload control.

## Layer Impact

`client-data-lane`: Improves the client-scoped data-load setup surface and keeps the active-client workflow clear before operators upload or commit data.

`global-control-lane`: Updates the shared admin setup UI and read model for all clients using the canonical admin shell.

## Client Applicability

- All clients: Setup page presentation and workflow copy.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air benefit from the pilot data-load studio view.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/admin/SetupDataLoadCenter.tsx`
- `src/lib/admin/setup-data-load-center.ts`
- `src/app/(maestro)/admin/setup/__tests__/page-source.test.ts`
- `src/lib/admin/__tests__/setup-data-load-center.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath 'src/lib/admin/__tests__/setup-data-load-center.test.ts' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' --runInBand`
- PASS: `npx eslint 'src/components/admin/SetupDataLoadCenter.tsx' 'src/lib/admin/setup-data-load-center.ts' 'src/app/(maestro)/admin/setup/__tests__/page-source.test.ts' 'src/lib/admin/__tests__/setup-data-load-center.test.ts'`
- PASS: `git diff --check origin/main...HEAD`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main after CI passes. Vercel production deploy makes the revised Setup page active without a migration or environment variable change.

## Rollback Plan

Revert the PR to restore the prior Setup page. No data migration or durable state change is required.

## Audit Evidence

Audit evidence will include the PR URL, CI run, and production post-deploy crawl after merge.

## Known Gaps

The page links to existing upload controls but does not yet execute the planned SkyHarbor seed erase, synthetic file generation, load, parse, validation, and commit workflow. That should run as a separate data-lane execution slice.
