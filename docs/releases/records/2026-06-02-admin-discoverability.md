# 2026-06-02-admin-discoverability — Admin Sidebar Discoverability

## Release ID

`2026-06-02-admin-discoverability`

## Status

`candidate`

## Plain-English Summary

The Admin sidebar now exposes the canonical Templates and Outputs workspaces alongside Data Loads, Data Trust, Connectors, Users & Access, and readiness/governance pages. This makes setup/admin work easier to find while keeping Home reserved for insight review.

## Layer Impact

- `global-control-lane`: Updates the shared Admin navigation configuration and regression coverage used by all client workspaces.

## Client Applicability

- All clients: Applies to every authenticated Admin workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/admin-shell-config.ts`: Adds `Templates` and `Outputs` sidebar entries and clarifies Data Loads copy as governed uploads and approvals.
- `src/lib/admin/__tests__/admin-shell-config.test.ts`: Adds tests that canonical setup/admin workspaces route to `/admin/*` and do not leak back into `/home/*`.

## QA / Validation

- Passed: `npx jest --runTestsByPath 'src/lib/admin/__tests__/admin-shell-config.test.ts' 'src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts' --runInBand`
- Passed: `npx eslint 'src/lib/admin/admin-shell-config.ts' 'src/lib/admin/__tests__/admin-shell-config.test.ts'`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Not run locally: full typecheck/build; covered by CI after PR.
- Pending CI after PR: release control, typecheck, lint, route integrity, accessibility, browser matrix, and Vercel preview checks.

## Rollout Plan

Merge to `main`; Vercel deploys the Admin navigation update through the normal control-plane pipeline. No database migration, feature flag, or manual runbook is required.

## Rollback Plan

Revert the PR to remove the new sidebar entries and regression test. No data rollback is required.

## Audit Evidence

- PR: pending.
- Local focused test output.
- CI check rollup after PR opens.

## Known Gaps

This does not implement private data-plane loading, template parsing, schema clarification, or output generation. It only improves Admin navigation discoverability for already existing Admin routes.
