# 2026-09-09-source-artifact-action-queue — Clarify Artifact Review Actions

## Release ID

`2026-09-09-source-artifact-action-queue`

## Status

`candidate`

## Plain-English Summary

The Source event artifact queue now distinguishes blocking deliverable work from supporting evidence review. When an accepted final fails deterministic content checks, the operator sees the actual content problem and can upload a corrected authoritative final instead of receiving an unrelated evidence-review instruction.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / product projection: Source event artifact lifecycle presentation and replacement-final control only.
- Layers 1-3: No intake, adapter, canonical data, schema, or tenant-data changes.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Clarify blocker and evidence-item counts in the current-stage artifact review queue.
- Add a replacement-final action for accepted artifacts with blocking content findings.
- Add focused regression coverage for mixed blocker/evidence queues.

## QA / Validation

- PASS: focused Source analytics canvas tests.
- PASS: scoped ESLint for touched TypeScript files.
- PASS: TypeScript no-emit validation.
- PASS: release and diff checks before PR.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deployment workflow builds and deploys the exact merge SHA. Run signed-in Source event artifact-queue proof after the healthy revision receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: Recorded by the workflow after merge.
- ACA runtime invariant: Template, traffic revision, and approved digest must match.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, current-stage Files and deliverables queue.

## Rollback Plan

Revert the squash merge through a new pull request and let the same ACA workflow deploy the prior queue behavior. No data rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- Focused test, lint, typecheck, release-check, and diff-check output.
- ACA workflow run for the merge SHA.
- Signed-in Source event queue screenshot or DOM capture.

## Known Gaps

This release does not promote or approve source evidence. Evidence readiness remains governed by the existing review workflow.
