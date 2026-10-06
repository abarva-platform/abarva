# Source Historical Gate Readiness

## Release ID

`2026-09-09-source-historical-gate-readiness`

## Status

`candidate`

## Plain-English Summary

Source now distinguishes a stage that advanced under an earlier control state from a stage that is waiting for approval today. Current evidence and artifact gaps remain visible as remediation work, but the interface no longer asks an operator to approve the same stage again.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 - Client intake: no change.
- Layer 2 - Source adapters: no change.
- Layer 3 - Canonical model: no change.
- Layer 4 - Products: Source workflow, readiness, intelligence, and approval presentation.

## Client Applicability

- All clients: yes, for Source events that advanced before complete stage-level approval metadata was captured.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event canvas controls apply.

## Changes Included

- Added an explicit `historical` approval trace state when stage advancement is known but approver and timestamp metadata are not recorded.
- Changed the operating panel from an open gate prompt to a recorded-decision/remediation state after approval.
- Preserved current artifact and gate-criteria gaps instead of hiding them.
- Removed language that described historical gaps as accepted exceptions without an explicit exception record.
- Updated Intelligence and approval guidance so no surface asks for a duplicate stage decision.

## QA / Validation

- Focused Source shell model and rendered stage-approval tests: passed.
- Scoped ESLint: passed.
- TypeScript `--noEmit`: passed with an 8 GB Node heap.
- `git diff --check`: passed.
- Live signed-in proof is required after the exact merged SHA deploys.

## Rollout Plan

Merge through a pull request. Allow the repository-owned ACA main deploy workflow to build and deploy the exact merge SHA, then revisit a previously advanced Source stage with current review gaps.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repository workflow only.
- Approved image digest: record after deploy.
- ACA runtime invariant: template, active 100% traffic revision, and required workers must match the approved digest.
- Live signed-in proof required: yes; the stage must show recorded historical advancement, current remediation gaps, and no open-approval instruction.

## Rollback Plan

Revert the merge through a pull request and allow the main deploy workflow to restore the previous readiness copy. No data or schema rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deployment run, revision, image digest, and traffic/runtime invariant readback.
- Signed-in stage, Files, and Approvals screenshots or DOM assertions.

## Known Gaps

- Historical advancement proves that the workflow moved forward; it does not invent an approver, timestamp, rationale, or exception record that was not captured.
- This release changes presentation only and does not mark any current evidence gap as resolved.
