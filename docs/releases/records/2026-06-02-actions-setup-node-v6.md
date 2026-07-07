# 2026-06-02-actions-setup-node-v6 — GitHub Setup Node v6 Upgrade

## Release ID

`2026-06-02-actions-setup-node-v6`

## Status

`candidate`

## Plain-English Summary

This release upgrades the shared GitHub Actions `actions/setup-node` step from v4 to v6 across the repository's CI workflows. The app behavior, client data, routes, and database schema do not change. The value is operational: CI jobs use the newer Node 24-capable action instead of the older Node 20-targeted action that GitHub has started warning about.

## Layer Impact

- `global-control-lane`: Updates shared CI workflow infrastructure used to validate all client-impacting changes.
- `internal-admin`: Improves AbarVa engineering/release automation reliability by reducing upcoming GitHub Actions runtime deprecation risk.

## Client Applicability

- All clients: Indirectly, because the CI gates protecting all client releases use this workflow action.
- Specific clients: None.
- Internal only: AbarVa engineering and release automation.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- PR #2770 updates `actions/setup-node@v4` to `actions/setup-node@v6` in the affected `.github/workflows/*.yml` files.
- No runtime application files, schema files, migrations, seeds, or client data are changed.

## QA / Validation

- PR #2770 CI passed all non-release-record checks before this release record was added, including Typecheck + reasoning-layer tests, ESLint, hygiene gate, Routes and disclaimers, Production readiness gate, Wave 0 harnesses, Atlas quality, canonical tenant allowlist, and Vercel preview checks.
- Release-control failure before this commit was the expected missing release-record failure for workflow changes.
- `npm run release:check -- --base origin/main --head HEAD` will be rerun after this record lands on the PR branch.

## Rollout Plan

Merge PR #2770 to `main`. The next GitHub Actions runs will use `actions/setup-node@v6` wherever this PR updates the workflow files. There is no Vercel runtime rollout and no database migration.

## Rollback Plan

Revert PR #2770 to return the affected workflows to `actions/setup-node@v4`. Rollback affects CI execution only; it does not change application runtime behavior or client data.

## Audit Evidence

- PR #2770: `https://github.com/anandsundaram-hash/abarva/pull/2770`.
- Dependabot commit: `6e691ff16ca981cf007b99e224c6b4848d134419`.
- Prior PR checks on #2770 showed all functional gates passing and only `Release record and impact note` failing.
- This release record documents the workflow-runtime impact required by release control.

## Known Gaps

This upgrades only `actions/setup-node`. Separate Dependabot PRs remain open for `actions/checkout`, `actions/upload-artifact`, `azure/login`, and npm dependency groups.
