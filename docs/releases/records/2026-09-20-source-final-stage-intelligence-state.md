# Source Final-Stage Intelligence State

## Release ID

`2026-09-20-source-final-stage-intelligence-state`

## Status

`candidate`

## Plain-English Summary

Source New now distinguishes a resolved sourcing playbook that has no separate
evidence contract for a final stage from an event whose playbook is unresolved.
Completed events keep their fail-closed evidence posture without displaying the
contradictory instruction that their already-resolved archetype still needs to
be resolved.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product projection: adjusts the Source New intelligence view model and
  presentation copy only. Canonical facts, event state, evidence state, money,
  readiness, and workflow authority are unchanged.

## Client Applicability

- All clients: yes, when Source New renders an event at a stage for which its
  resolved archetype has no separate evidence contract.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add an explicit stage-evidence-contract state to the Source New intelligence
  projection.
- Provide final-stage lifecycle-evidence guidance for resolved completed events.
- Preserve the existing unresolved-archetype refusal for genuinely unresolved
  events.
- Add behavior tests for both the projection and rendered workspace.

## QA / Validation

- Red test captured the contradictory resolved-archetype final-stage behavior.
- Focused projection and component suites: 45 tests passed.
- TypeScript, ESLint, release validation, and deployment proof are required
  before release.

## Rollout Plan

Squash-merge through a protected pull request. The repo-owned ACA main deploy
workflow builds and deploys the exact merge SHA. After deployment, repeat the
signed-in completed-event Intelligence check.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: populated by the deploy workflow.
- ACA runtime invariant: web template, active 100% traffic revision, and required
  workers must use the same approved digest.
- Worker image invariant: required.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash-merge and redeploy through the repo-owned ACA main workflow.
No data or schema rollback is required.

## Audit Evidence

- Focused Jest output for the Source New intelligence projection and workspace.
- Pull-request checks and release validation.
- ACA deploy run, revision, digest, health, traffic, and worker-image readback.
- Signed-in completed-event Intelligence screenshot or accessibility-tree proof.

## Known Gaps

- This change does not add a final-stage evidence contract to any archetype.
- It does not promote evidence, change readiness, or create a value claim.
