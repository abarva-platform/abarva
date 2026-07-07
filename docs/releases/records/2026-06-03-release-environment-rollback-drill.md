# 2026-06-03-release-environment-rollback-drill — Release Environment and Rollback Drill Plan

## Release ID

`2026-06-03-release-environment-rollback-drill`

## Status

`candidate`

## Plain-English Summary

Adds a clear release environment plan and rollback drill checklist. It explains
what local, PR preview, pre-prod preview, first-client pilot production, and
multi-client production mean, and what evidence is required before promoting or
rolling back releases.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: release governance, environment strategy, and rollback evidence.
- Runtime impact: no application behavior, data, auth, or infrastructure changes.

## Client Applicability

- All clients: future release planning and rollout evidence use this model.
- Specific clients: none.
- Internal only: release operators and founder/admin review.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/runbooks/release-environment-and-rollback-drill.md`
- `docs/runbooks/rollback.md`
- `docs/build/RELEASE_ENVIRONMENT_ROLLBACK_DRILL_2026-06-03.md`
- `scripts/release/verify-release-environment-plan.mjs`

## QA / Validation

- Pass: `node scripts/release/verify-release-environment-plan.mjs`
- Pass: focused ESLint for `scripts/release/verify-release-environment-plan.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked/not run: live rollback drill execution and evidence packet are
  operational steps and remain pending.

## Rollout Plan

Merge to `main`. Operators use the runbook before pilot promotion and during
release planning.

## Rollback Plan

Revert this PR. No runtime rollback is required.

## Audit Evidence

- This release record.
- Release environment runbook.
- Build manifest.
- Verifier output.
- Pull request and CI checks.

## Known Gaps

T039 remains `In progress` until a real rollback drill is executed and its
evidence packet is attached.
