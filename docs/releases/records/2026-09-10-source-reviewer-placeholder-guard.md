# 2026-09-10-source-reviewer-placeholder-guard - Source reviewer placeholder guard

## Release ID

2026-09-10-source-reviewer-placeholder-guard

## Status

candidate

## Plain-English Summary

Source now refuses to record an evidence-availability review when the canonical person record contains a generic placeholder instead of a human display name. The actor email remains useful context, but it cannot substitute for the named reviewer required by the audit contract.

## Layer Impact

- global-control-lane, Layer 4 product projection: fail-closed reviewer validation for Source evidence-availability review.
- Layers 1-3: no schema, adapter, canonical-data, or tenant-data changes.

## Client Applicability

- All clients: yes, for Source evidence-availability reviews.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Rejects empty and known placeholder person names before rendering or recording a review.
- Adds a focused regression test for placeholder reviewer identity.

## QA / Validation

- PASS: focused availability-review route tests.
- PASS: scoped ESLint.
- PASS: repository TypeScript validation under Node 24.
- PASS: release control check.
- NOT RUN: pull-request checks; recorded before merge.
- NOT RUN: signed-in fail-closed proof; required after governed deployment.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deployment workflow builds and deploys the exact merge SHA. Signed-in proof must show the review preview is blocked when the person record contains a placeholder name.

## Deployment Authority

- Repo-owned deploy workflow: .github/workflows/aca-main-deploy.yml only.
- Shared runtime mutators: repository-owned ACA workflow only.
- Approved image digest: pending deployment.
- Ring/weight: shared Product/Lab after health and runtime-invariant gates pass.
- Feature flag/env update: none.
- Runtime proof required: yes.

## Rollback Plan

Revert the squash merge through a pull request and redeploy through the repository-owned ACA main workflow. No schema or data rollback is required.

## Audit Evidence

- Focused route test proving placeholder names fail closed.
- Pull request, governed deployment run, runtime-invariant evidence, and signed-in fail-closed proof after release.

## Known Gaps

The canonical person record still needs an operator-owned correction before that person can record a Source evidence review. This release deliberately does not mutate identity data.
