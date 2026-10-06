# 2026-09-10-source-evidence-review-contract - Source evidence review contract

## Release ID

`2026-09-10-source-evidence-review-contract`

## Status

`candidate`

## Plain-English Summary

Source now separates a human review of parsed-evidence availability from a client-stated answer and from legal, security, commercial, supplier, or finance approval. Before anything is recorded, the operator sees the exact action label, resolved reviewer identity, resulting evidence state, and non-approval disclaimer.

## Layer Impact

- `global-control-lane`, Layer 4 product projection: the Source evidence checklist previews and records an explicit availability-only review.
- Layers 1-3: no schema, adapter, canonical-data, or tenant-data changes.

## Client Applicability

- All clients: yes, for Source evidence checklists.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a tenant-scoped parsed-evidence review route with separate GET preview and POST record operations.
- Requires a resolved tenant person record before a review can be attributed.
- Rejects review when the evidence lifecycle has not reached `Parsed`.
- Records `evidence_reviewed` with `availability_only`, `approvalGranted: false`, and uploaded-evidence review provenance.
- Replaces the checklist's client-stated-answer call with the dedicated review contract.
- Amends the preceding release record so it no longer describes the two actions as equivalent.

## QA / Validation

- PASS: focused availability-review route suite (`4` tests).
- PASS: focused Source canvas behavior suite (`4` tests).
- PASS: scoped ESLint for the route, component, and focused tests.
- PASS: repository TypeScript validation under the required Node 24 runtime with an 8 GB compiler heap.
- PASS: release control check.
- NOT RUN: pull-request checks; recorded before merge.
- NOT RUN: signed-in record-preview proof; required after governed deployment and before any review record is written.

## Rollout Plan

Squash merge through a pull request. The repository-owned ACA main deploy workflow builds and deploys the exact merged SHA. Signed-in proof must show the resolved reviewer and non-approval semantics before any review is recorded.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge through a pull request and redeploy through the repository-owned ACA main workflow. No schema or data rollback is required because no review records will be written as part of rollout.

## Audit Evidence

- Focused route tests proving exact preview payload, resolved-person requirement, parsed-state requirement, and non-approval activity metadata.
- Source canvas behavior test proving the preview renders before the POST action.
- Pull request, governed deployment run, runtime-invariant evidence, and signed-in preview screenshot after release.

## Known Gaps

Existing evidence reviews remain human actions. This release makes their meaning and attribution explicit; it does not authorize an operator to review content they have not examined.
