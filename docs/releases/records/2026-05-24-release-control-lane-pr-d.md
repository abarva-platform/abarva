# 2026-05-24-release-control-lane-pr-d — Release Gate Actions v6 Upgrade

## Release ID

`2026-05-24-release-control-lane-pr-d`

## Status

`candidate`

## Plain-English Summary

This release upgrades the release-control workflow to the current major versions of the official GitHub actions. The prior release forced Node 24 successfully, but GitHub still emitted an annotation because `actions/checkout@v4` and `actions/setup-node@v4` target Node 20. This release moves the workflow to `actions/checkout@v6` and `actions/setup-node@v6` so the release gate uses Node 24-native actions.

It also fixes a concurrent release-check integration issue: `npm run release:check` now resolves through `scripts/release-check.mjs`, so that script is converted into a wrapper around the strict release-control checker. That keeps one canonical gate instead of a weak dataset-only checker running in CI.

## Layer Impact

- `ops-release-lane`: Updates release-control CI dependencies from action major version 4 to major version 6.
- `ops-release-lane`: Restores `npm run release:check` to the strict release-record checker after a concurrent merge introduced a dataset-only checker at the npm entry point.
- `app-control-lane`: No runtime app behavior changes. This only changes the release governance workflow that protects future app-control changes.

## Client Applicability

- All clients: Future release governance applies to all client-impacting releases.
- Specific clients: None.
- Internal only: AbarVa engineering and release automation.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- `.github/workflows/release-control.yml` uses `actions/checkout@v6`.
- `.github/workflows/release-control.yml` uses `actions/setup-node@v6`.
- The temporary `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` workflow environment override is removed.
- `scripts/release-check.mjs` now delegates to `scripts/release-control/check-release-record.mjs`.
- `docs/releases/records/2026-05-24-release-control-lane-pr-c.md` now reflects the released state of PR #2306.

## QA / Validation

- `gh api repos/actions/checkout/releases/latest --jq '.tag_name'` returned `v6.0.2`.
- `gh api repos/actions/setup-node/releases/latest --jq '.tag_name'` returned `v6.4.0`.
- `npm run release:check -- --base origin/main --head HEAD` passed locally and found this release record.
- `node scripts/release-control/check-release-record.mjs --base origin/main --head HEAD` passed locally.
- `npm run release:check` was verified after the wrapper change so CI uses the strict release-control gate.
- `git diff --check` passed locally.

## Rollout Plan

Merge this PR to `main`. Future release-control workflow runs will use the current official GitHub action major versions and the npm entry point will execute the strict release-record checker.

## Rollback Plan

Revert this PR to return the release-control workflow to the prior action versions, force flag, and npm entry-point behavior. Rollback affects only release-control CI behavior, not app runtime behavior or database state.

## Audit Evidence

- Official GitHub API release checks for `actions/checkout` and `actions/setup-node`.
- Manual workflow dispatch run `26349136937` passed but still produced the forced-runtime annotation before this upgrade.
- Local validation output for `npm run release:check -- --base origin/main --head HEAD`.
- Local validation output for direct strict checker execution.

## Known Gaps

The final proof is a post-merge manual dispatch on `main`; this PR should not be considered fully released until that workflow run passes without the Node 20 target annotation.
