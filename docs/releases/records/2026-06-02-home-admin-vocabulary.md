# 2026-06-02-home-admin-vocabulary — Home Admin Vocabulary Alignment

## Release ID

`2026-06-02-home-admin-vocabulary`

## Status

`candidate`

## Plain-English Summary

Home-facing copy now treats Admin as the operator workspace and avoids setup-era labels in the Home experience. The Home entry tile, attention card, no-workspace message, Admin action-surface lead, and shared Atrium module contract now say Admin where users would otherwise see Setup.

## Layer Impact

- `global-control-lane`: Updates shared Home and shell metadata/copy for the Admin/Home separation.

## Client Applicability

- All clients: Users see clearer Home/Admin separation in shared Home and shell surfaces.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `src/components/home/AgenticHomeEntry.tsx` Admin tile and Steward attention-card eyebrow.
- Updated `src/components/home/HomeIndexPage.tsx` no-workspace guidance from Setup to Admin.
- Updated `src/components/home/HomeOverviewV2.tsx` Admin action-surface lead to avoid setup-era phrasing.
- Updated `src/lib/shell/atrium-contract.ts` so the Steward operator module displays as Admin while preserving the internal `setup` module id.
- Added focused regression coverage in Home boundary and Atrium contract tests.

## QA / Validation

- PASS: `npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts' src/lib/home/__tests__/panel-inventory.test.ts src/lib/shell/__tests__/atrium-contract.test.ts src/components/shell/__tests__/topbar-nav-home-admin.test.ts --runInBand`
- PASS: `git diff --name-only --diff-filter=ACM | rg '\.(ts|tsx)$' | xargs npx eslint`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and deploy normally through Vercel. No migration, feature flag, or private data-plane rollout is required.

## Rollback Plan

Revert this PR to restore the previous Home and shell labels. No data rollback is required.

## Audit Evidence

- Pull request: pending.
- Focused test output listed above.
- Release record check passed locally.

## Known Gaps

This slice intentionally does not rename internal `setup` module ids, `Setup*` component/type names, or historical docs. Those remain separate cleanup work to avoid unnecessary churn.
