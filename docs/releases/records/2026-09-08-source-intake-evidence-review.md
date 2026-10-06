# 2026-09-08-source-intake-evidence-review - Source intake evidence review

## Release ID

`2026-09-08-source-intake-evidence-review`

## Status

`candidate`

## Plain-English Summary

Source now reconciles a sourcing trigger already captured during event intake
with the Strategy evidence checklist. The trigger stays visibly client-stated
and still needs an authorized human review before a hard gate can clear.

## Layer Impact

- `global-control-lane`: Layer 4 Source workflow and its governed per-event
  evidence state.
- Layers 1 through 3 are unchanged; no client dataset or canonical fact is
  rewritten.

## Client Applicability

- All clients: yes, for newly created and existing Source sourcing events with
  a captured intake trigger.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds idempotent event-intake evidence synchronization.
- Distinguishes an explicit authorized human criterion review from automatic
  gate assessment.
- Refreshes focused test fixtures to include every required Strategy input.

## QA / Validation

- PASS: 35 focused unit and route tests.
- PASS: scoped ESLint.
- PASS: TypeScript no-emit check.
- PASS: diff whitespace check.
- PENDING: post-deploy signed-in Source stage proof.

## Rollout Plan

Merge by pull request, then deploy through the repository-owned Azure Container
Apps main workflow. Recheck the affected Source event after the new revision is
healthy and receives all shared traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: web template and 100% traffic revision must match.
- Worker image invariant: required workers must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a new pull request and redeploy the resulting
main SHA. The synchronization is upgrade-only and never downgrades stronger
evidence states.

## Audit Evidence

Inspect the pull request, focused test output, ACA deployment run and digest
readback, plus the signed-in Source gate response captured after rollout.

## Known Gaps

The current event still needs its authorized reviewer actions and downstream
stage execution after this candidate deploys.
