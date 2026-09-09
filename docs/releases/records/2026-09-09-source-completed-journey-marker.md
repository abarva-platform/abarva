# Source completed journey marker

## Release ID

`2026-09-09-source-completed-journey-marker`

## Status

`candidate`

## Plain-English Summary

Show an approval-backed final Source stage as complete when the event lifecycle is completed, rather than leaving the final journey marker visually active.

## Layer Impact

- Layer 4 product projection, `global-control-lane`: Source event journey presentation only.
- No intake, adapter, canonical data, schema, cube, corpus, or tenant-data mutation.

## Client Applicability

All clients with completed Source events. The completion mark remains fail-closed: it requires both the completed lifecycle state and an approval record for the current stage.

## Changes Included

- Add the previously defined `complete` journey state for an approval-backed completed current stage.
- Render that state with the same completion check treatment as earlier approved stages.
- Extend focused shell-model coverage for terminal completion.

## QA / Validation

- PASS: focused Source event shell tests (24 tests).
- PASS: scoped ESLint and full TypeScript checks.
- PASS: local `npm run release:check` and `git diff --check`.
- NOT RUN: live signed-in completed-event journey proof; required after deployment.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Verify all journey stages, including Value, show approval-backed completion.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: template image, active revision, and worker images must match.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. Lifecycle and approval records are unchanged.

## Audit Evidence

- Focused test output, PR, merge SHA, ACA deploy run, runtime invariant, and signed-in journey proof.

## Known Gaps

Stages without approval evidence remain unmarked even if their position is earlier in the journey.
