# 2026-10-07-source-event-evidence-action-and-phase-marker

## Release ID

`2026-10-07-source-event-evidence-action-and-phase-marker`

## Status

`candidate`

## Plain-English Summary

The event workspace now names the first open required evidence item in its fixed progress area, including its current and required states. When progression is locked, the visible command opens the evidence workspace; a green Continue or approval command appears only when the existing readiness checks allow it. A past phase with a recorded file is labelled "Recorded" rather than shown with a completion tick. Recording a file does not prove that every supplier has an executed NDA.

## Layer Impact

Release lane: `global-control-lane`.

- Products (Source): presentation and navigation only. The existing canonical evidence requirements and event evidence readback determine the blocker.
- Canonical model, client intake, and source adapters: unchanged.

## Client Applicability

- All clients: yes, for the event workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- The Source event canvas gives a locked progress area a specific evidence summary and a link to Files, while keeping the server approval gate and green progression rule unchanged.
- The event rail uses a neutral marker and "Recorded" label for a past phase with a file but no completion proof.
- Focused render tests cover the evidence command, the recorded phase marker, and the locked approval state.

## QA / Validation

- Red-first tests failed for the previously generic blocker and completion tick, then passed after the change.
- `npx jest src/components/source/canvas/analytics/__tests__ --runInBand --silent`: 29 suites and 257 tests passed.
- TypeScript check using Node 24 and an 8 GB heap: passed.
- Mutation checks: replacing the named blocker with generic copy caused two focused failures; restoring the completion tick for a recorded phase caused one focused failure. Both mutations were reverted.

## Rollout Plan

Squash-merge the reviewed PR to `main`; only the repo-owned ACA main workflow deploys the web image. Verify the approved image digest in the template, serving revision, and required workers, then replay the event workspace signed in before calling this live-proven. No migration or data load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: template, 100%-traffic revision, and worker images must match the approved digest.
- Worker image invariant: verify separately after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, the blocked and ready progress states and phase rail.

## Rollback Plan

Revert the presentation PR through a new reviewed PR and let the repo-owned main workflow deploy it. No database rollback is needed.

## Audit Evidence

The PR diff, focused Jest output, TypeScript result, release gate output, main deployment record, ACA image readback, and signed-in event replay.

## Known Gaps

The recorded phase label does not calculate per-supplier NDA coverage. It intentionally avoids asserting completion from a file alone. Signed-in proof is pending deployment.
