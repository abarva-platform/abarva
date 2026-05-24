# 2026-05-24-release-control-lane-pr-b — Release Control Manual Dispatch Hardening

## Release ID

`2026-05-24-release-control-lane-pr-b`

## Status

`candidate`

## Plain-English Summary

This release hardens the release-control workflow after the first gate landed. Pull-request enforcement already works; this follow-up makes manual workflow runs use `main` as the default comparison base, and it marks the first release-control record as released now that PR #2303 is merged.

## Layer Impact

- `ops-release-lane`: Updates the GitHub Actions release-control workflow so manual dispatch uses a real base branch.
- `app-control-lane`: No runtime app behavior changes. This only affects release governance for future app/control-lane changes.

## Client Applicability

- All clients: The governance applies to all future client-impacting releases.
- Specific clients: None.
- Internal only: AbarVa engineering and release operations.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- `.github/workflows/release-control.yml` now defaults manual release-control runs to `origin/main`.
- `docs/releases/records/2026-05-24-release-control-lane-pr-a.md` now reflects the merged/released state of PR #2303.

## QA / Validation

- `npm run release:check -- --base origin/main --head HEAD` passed locally and found this release record.
- `node scripts/release-control/check-release-record.mjs --base origin/main --head HEAD` passed locally.
- `git diff --check` passed locally.

## Rollout Plan

Merge this PR to `main`. The release-control gate remains active for pull requests, and manual dispatch runs will use `main` as their default base.

## Rollback Plan

Revert this PR. Rollback only restores the prior manual-dispatch behavior and the prior candidate status text; it does not affect product runtime behavior or database state.

## Audit Evidence

- PR for this follow-up release-control hardening slice.
- Local validation output for `npm run release:check -- --base origin/main --head HEAD`.
- Prior merged release-control PR #2303.

## Known Gaps

The release ledger is still markdown-based. A DB-backed `/admin/releases` surface remains deferred to a later release-control slice.
