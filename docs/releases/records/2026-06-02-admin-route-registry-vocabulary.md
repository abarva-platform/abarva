# 2026-06-02-admin-route-registry-vocabulary — Admin Route Registry Vocabulary

## Release ID

`2026-06-02-admin-route-registry-vocabulary`

## Status

`candidate`

## Plain-English Summary

Canonical Admin route metadata now uses Admin wording instead of setup-era labels. The legacy `/setup` bridge still redirects to `/admin`, but it no longer describes Setup as the product navigation surface, and the legacy topbar account shortcut now says Admin.

## Layer Impact

- `global-control-lane`: Updates shared route-registry metadata, legacy bridge copy, and shell vocabulary tests for the Admin workspace.

## Client Applicability

- All clients: Admin-capable users see Admin wording in canonical metadata and the legacy topbar account shortcut.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Updated `src/lib/routes/registry.ts` Admin route labels from setup-era labels to Admin labels.
- Updated `src/app/setup/page.tsx` compatibility bridge comment to describe `/setup` as a legacy bridge to `/admin`.
- Updated `src/components/AbarvaNav.tsx` account-menu shortcut label from Setup to Admin.
- Added focused regression coverage in `src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts` and `src/components/shell/__tests__/admin-shell-vocabulary.test.ts`.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts src/__tests__/integration/ops/route-registry.test.ts src/components/shell/__tests__/admin-shell-vocabulary.test.ts --runInBand`
- PASS: `git diff --name-only --diff-filter=ACM | rg '\.(ts|tsx)$' | xargs npx eslint`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and deploy normally through Vercel. No migration, feature flag, or private data-plane rollout is required.

## Rollback Plan

Revert this PR to restore the previous route-registry labels and topbar shortcut copy. No data rollback is required.

## Audit Evidence

- Pull request: pending.
- Focused test output listed above.
- Release record check passed locally.

## Known Gaps

This slice intentionally does not rename internal `Setup*` component/type identifiers or historical docs. Those remain separate cleanup work to avoid unnecessary churn.
