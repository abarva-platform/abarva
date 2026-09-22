# 2026-09-22-source-ava-governed-single-answer — Reconcile Governed Source Answers

## Release ID

`2026-09-22-source-ava-governed-single-answer`

## Status

`candidate`

## Plain-English Summary

When Source aVa recognizes a question with a governed answer, the governed answer now becomes the only prose answer shown to the user. Older deterministic or model response parts can no longer remain mounted above it and make a conflicting claim.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: the Source event chat stream reconciles its summary fields before sending a recognized governed answer. No canonical data or source adapter changes.

## Client Applicability

- All clients: Yes, for Source event aVa questions that resolve to a governed answer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source availability only; no new flag.

## Changes Included

- Add a pure governed-answer stream reconciliation helper.
- Apply it to the Source event aVa NDJSON summary line.
- Add focused unit and route-level behavior coverage.

## QA / Validation

- Focused unit test: 3 passed.
- Focused Source route test: 2 passed.
- Mutation proof: retaining the pre-existing response parts fails the single-answer behavior test.
- TypeScript, scoped ESLint, release check, and hosted CI are required before merge.

## Rollout Plan

Squash merge through the protected pull-request lane. The repo-owned ACA main deploy workflow builds and deploys the exact merged revision. Verify the immutable runtime digest, then repeat the signed-in Source event question.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a pull request and allow the repo-owned ACA workflow to deploy the revert. No data rollback is required.

## Audit Evidence

- Focused Jest output and mutation failure captured in the execution claim.
- Pull request, hosted CI, deploy run, runtime invariant artifact, and signed-in replay will be recorded as separate evidence.

## Known Gaps

The change does not promote evidence, approve artifacts, mutate event state, or alter how governed answers are calculated.
