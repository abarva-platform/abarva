# 2026-09-10-source-evidence-reviewer-person - Source evidence reviewer identity

## Release ID

`2026-09-10-source-evidence-reviewer-person`

## Status

`candidate`

## Plain-English Summary

Source evidence-availability reviews now resolve the displayed and recorded reviewer name from the canonical person record instead of accepting a generic authentication fallback. The review remains availability-only and grants no legal, security, commercial, supplier, or finance approval.

## Layer Impact

- `global-control-lane`, Layer 4 product projection: reviewer attribution for Source evidence-availability review.
- Layers 1-3: no schema, adapter, canonical-data, or tenant-data changes.

## Client Applicability

- All clients: yes, for Source evidence-availability reviews.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Resolves the reviewer display name and email from the canonical `persons` row by authenticated person ID.
- Uses that canonical identity in the preview, evidence note, and activity record.
- Fails closed when the person row or its display name is missing.

## QA / Validation

- PASS: focused availability-review route tests, including generic-auth-name replacement and missing-person-name rejection.
- PASS: scoped ESLint.
- PASS: repository TypeScript validation under Node 24.
- PASS: release control check.
- NOT RUN: pull-request checks; recorded before merge.
- NOT RUN: signed-in preview proof; required after governed deployment and before any review record is written.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merged SHA. Signed-in proof must show the canonical reviewer identity and non-approval disclaimer before any review is recorded.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a pull request and redeploy through the repository-owned ACA main workflow. No schema or data rollback is required.

## Audit Evidence

- Focused route tests proving canonical person resolution and fail-closed reviewer attribution.
- Pull request, governed deployment run, runtime-invariant evidence, and signed-in preview proof after release.

## Known Gaps

Reviewing evidence remains a human action. This release corrects identity attribution; it does not authorize a review or make the evidence content approved.
