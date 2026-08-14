# 2026-08-14-source-stage-shell-layout-harness - Source Stage Shell Layout Harness

## Release ID

`2026-08-14-source-stage-shell-layout-harness`

## Status

`candidate`

## Plain-English Summary

Adds a CI-backed Source layout harness that renders the Source journey rail and
generic stage canvas for all 11 New Event stages across desktop, tablet, and
mobile widths. The harness checks that the selected stage is visible, the stage
canvas renders one active stage area, progress/gate/deliverable text is present,
and the page does not overflow horizontally.

This is a QA guard only. It does not change workflow behavior, persistence,
upload parsing, data-plane records, approvals, or stage advancement.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source gains a CI layout smoke harness for the 11-stage New Event
  shell.
- Client Intake: No change.
- Source Adapters: No change.
- Canonical Model: No change.

## Client Applicability

- All clients: CI guard protects the shared Source shell.
- Specific clients: None.
- Internal only: QA harness and release-control evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/qa/source-stage-shell-layout-harness.ts`
- `package.json`
- `.github/workflows/source-layout-smoke.yml`

## QA / Validation

- Pass: local `npm run qa:source-stage-shell-layout`.
- Pass: local `npm run qa:source-responses-layout`.
- Pass: local prettier check for changed files.
- Pass: local `npm run release:check`.
- Pending GitHub Source Layout Smoke workflow.

## Rollout Plan

Merge through normal PR. The harness becomes active in CI through
`.github/workflows/source-layout-smoke.yml`. Any standard main deployment that
runs after merge is owned by the repository ACA workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if the
  normal main merge deploy runs.
- Shared runtime mutators: None in this change.
- Approved image digest: Pending deploy if the main workflow runs.
- ACA runtime invariant: Required only if the main workflow runs.
- Worker image invariant: Required only if the main workflow runs.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this CI-only harness.

## Rollback Plan

Revert the PR. This removes the new harness command and stops the Source layout
workflow from running the all-stage shell smoke.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6279
- Local validation: pass for stage shell harness, Responses harness, Prettier,
  and release check.
- GitHub Source Layout Smoke: pending.
- ACA deploy proof: pending if the standard main workflow runs.

## Known Gaps

This harness covers the generic stage shell and journey rail. Stage-specific
task bodies, Files, Intelligence, Guidebook, and Approval workspaces still need
deeper stage-by-stage smoke coverage in later slices.
