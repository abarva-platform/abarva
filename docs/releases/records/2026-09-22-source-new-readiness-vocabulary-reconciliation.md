# 2026-09-22 Source New Readiness Vocabulary Reconciliation

## Release ID

`2026-09-22-source-new-readiness-vocabulary-reconciliation`

## Status

`candidate`

## Plain-English Summary

The event approval workspace now labels completed workflow inputs as workflow inputs instead of calling them evidence items. This keeps its stage-progress count distinct from the Files workspace's governed evidence-readiness count, so two different denominators no longer appear to contradict each other.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product presentation: adjusts Source New approval copy only. Canonical records, evidence states, workflow rules, and approval rules are unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Reword Source New approval-item readiness from required evidence to workflow-input completion.
- Add rendered regression coverage that keeps workflow completion distinct from governed evidence readiness.

## QA / Validation

- Red-first rendered test reproduced the conflicting approval wording.
- Focused Source New stage-approval suite passes after the correction.
- Full Source core suite passes: 78 suites and 746 tests.
- Mutation restoring the old evidence wording fails the new assertion.
- TypeScript, focused ESLint, release control, and hosted CI are required before merge.

## Rollout Plan

Squash merge through the protected main branch. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA. Verify the runtime invariant, then repeat the signed-in Source New Files-to-Approvals smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash commit and let the repo-owned ACA workflow redeploy the prior behavior. No data or schema rollback is required.

## Audit Evidence

- Focused rendered test output and mutation failure.
- Pull request checks and merge SHA.
- Repo-owned ACA run and runtime-invariant artifact.
- Signed-in Source New Files and Approvals readback after deployment.

## Known Gaps

This release does not make evidence ready, accept artifacts, approve a stage, or change lifecycle state.
