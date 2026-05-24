# 2026-05-24-release-control-lane-pr-c — Release Gate Node 24 Actions Runtime

## Release ID

`2026-05-24-release-control-lane-pr-c`

## Status

`candidate`

## Plain-English Summary

This release removes a warning from the release-control workflow by opting GitHub JavaScript actions into the Node 24 runtime now. The manual release-control run already passed, but GitHub warned that Node 20-backed actions will be forced to Node 24 soon. This makes the release gate align with the repo's Node 24 standard before that platform cutoff.

## Layer Impact

- `ops-release-lane`: Updates the release-control workflow environment so JavaScript actions run with Node 24.
- `app-control-lane`: No app runtime behavior changes. This only affects release governance automation.

## Client Applicability

- All clients: Future release governance applies to all client-impacting releases.
- Specific clients: None.
- Internal only: AbarVa engineering and release automation.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- `.github/workflows/release-control.yml` sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`.
- `docs/releases/records/2026-05-24-release-control-lane-pr-c.md` records the reason, impact, QA, rollout, and rollback.

## QA / Validation

- `npm run release:check -- --base origin/main --head HEAD` passed locally and found this release record.
- `node scripts/release-control/check-release-record.mjs --base origin/main --head HEAD` passed locally.
- `git diff --check` passed locally.

## Rollout Plan

Merge this PR to `main`. Future release-control workflow runs will opt GitHub JavaScript actions into Node 24.

## Rollback Plan

Revert this PR to remove the Node 24 action-runtime opt-in. Rollback affects only release-control CI behavior, not app runtime behavior or database state.

## Audit Evidence

- Manual workflow dispatch run `26349013184` passed before this change and produced the Node 20 deprecation warning.
- Local validation output for `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

No known gap for this workflow-runtime change. Broader release-ledger UX work remains covered by the earlier release-control records.
