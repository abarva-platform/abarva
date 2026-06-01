# 2026-06-01-setup-data-load-center-wireframe-ui — Setup Data Load Center Wireframe UI

## Release ID

`2026-06-01-setup-data-load-center-wireframe-ui`

## Status

`candidate`

## Plain-English Summary

This release turns the Setup Data Load Center page into the first-viewport decision design captured in the wireframe. The page keeps the existing admin shell, logo, top navigation, and tenant-bound page route, but the content now leads with active-client readiness, workflow gates, a data-loaded-by-dimension table, and a plain-language work queue instead of pushing users into a long implementation ledger.

## Layer Impact

- `global-control-lane`: Updates the shared Setup/Admin runtime page presentation and read model.
- `client-data-lane`: Adds UI/read-model fields that summarize pilot data-load completeness and action state for the active client.

## Client Applicability

- All clients: The page renders through `resolveAdminTenant()` and remains active-client scoped.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are the first visual QA focus.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/admin/SetupDataLoadCenter.tsx`
- `src/lib/admin/setup-data-load-center.ts`
- `src/lib/admin/__tests__/setup-data-load-center.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/admin/__tests__/setup-data-load-center.test.ts src/app/'(maestro)'/admin/setup/__tests__/page-source.test.ts --runInBand`
- Passed: `npx eslint src/components/admin/SetupDataLoadCenter.tsx src/lib/admin/setup-data-load-center.ts src/lib/admin/__tests__/setup-data-load-center.test.ts`
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `git diff --check origin/main...HEAD`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run: browser visual QA on `/admin/setup` for Apex Retail, Meridian Health, and SkyHarbor Air, because this local worktree does not have live Clerk sessions.

## Rollout Plan

Merge to `main` after green CI and allow Vercel production deployment. No migration or environment change is required.

## Rollback Plan

Revert the PR to restore the prior Setup Data Load Center layout and read model.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2742
- CI checks: to be added after GitHub Actions completes.
- Wireframe authority: `docs/platform-design/wireframes/setup-admin/setup-data-load-center-home-wireframe-2026-06-01.html`
- Focused model test: `src/lib/admin/__tests__/setup-data-load-center.test.ts`

## Known Gaps

This PR does not automate live browser login/logout checks across the three clients. It also does not wire real upload-run rows into the readiness table; the view model uses deterministic pilot-ready summary rows until the ledger API slice lands.
