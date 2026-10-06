# 2026-09-18-agent-answer-provenance-ci - Agent answer provenance checks

## Release ID

`2026-09-18-agent-answer-provenance-ci`

## Status

`candidate`

## Plain-English Summary

The PR behavior workflow now checks that agent answers are visibly identified as drafts and that uncited substantive text reports a citation gap. It runs the existing behavior assertions without gating on unrelated failing tests in the component suite.

## Layer Impact

Release lane: `global-control-lane`. CI verification only. No runtime, data, tenant, or approval behavior changes.

## Client Applicability

- All clients: Shared agent-answer presentation guard.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `.github/workflows/coverage-threshold.yml`: run three focused agent-provenance assertions in the existing PR behavior job.

## QA / Validation

- Focused agent-provenance assertions: 3 passed, 58 unrelated tests skipped.
- Existing behavior coverage gate: 195 passed; line coverage 95.35% against a 90% floor.
- Full dock suite remains 58 passed and three pre-existing failures; this change does not alter component behavior.
- Release gate: passed.

## Rollout Plan

Merge by PR. The check applies to future PRs. No runtime deployment is needed for this workflow-only change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` may run on merge; this change has no runtime effect.
- Shared runtime mutators: None.
- Approved image digest: Unchanged.
- ACA runtime invariant: Not applicable to the CI-only behavior.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: No; existing signed-in answer-label proof remains separate from the CI gate.

## Rollback Plan

Revert the PR to remove the focused workflow step. No data or runtime rollback is involved.

## Audit Evidence

Focused test result and PR workflow run.

## Known Gaps

The remaining component-suite failures require separate triage; this check does not claim the entire suite is green.
