# Moves Latest Generation Attempt Visibility

## Release ID

`2026-10-01-moves-latest-run-status`

## Status

`candidate`

## Plain-English Summary

The Moves Files view now distinguishes the most recent generation attempt from the latest successful artifact. A failed or blocked rebuild is shown as the current attempt, while an older successful file remains accessible only as explicitly labeled history.

## Layer Impact

- Release lane: `global-control-lane`.
- **Products — Moves:** Read-only artifact status and download presentation now reflects persisted run history. This does not change generation, approval, evidence, or phase-gate behavior.
- **Canonical data:** No schema or data changes. Run records are read within the active client scope.

## Client Applicability

- All clients: Moves Files view, when orchestrated generation history exists.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a client-scoped run-history query that retains the latest attempt and the most recent successful artifact per deliverable type.
- Update the Moves Files panel to show failed, blocked, queued, or running latest attempts, and prevent a prior artifact from appearing as the current build.
- Preserve the older successful artifact as a clearly labeled historical preview; it does not gain an approval action.

## QA / Validation

- PASS — repository regression verifies a failed latest attempt remains distinct from a prior successful artifact.
- PASS — UI regression verifies failure visibility, historical labeling, and absence of a misleading current-build or approval affordance.
- PASS — focused run-repository and Moves visible-controls suites (24 tests).
- PASS — ESLint on changed TypeScript files.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --incremental false`.
- PASS — `git diff --check`.
- Not run yet — CI, deployment, and signed-in verification.

## Rollout Plan

Merge through the protected pull-request path, then deploy the merged SHA through the repository-owned ACA main deploy workflow. No feature flag or data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending exact-SHA workflow completion.
- ACA runtime invariant: Pending deploy proof.
- Worker image invariant: Pending deploy proof.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Confirm a failed latest attempt remains visible after reload, prior output is labeled historical, and no approval control appears for it.

## Rollback Plan

Revert the application change through a follow-up pull request and deploy that merged SHA through the same repository-owned ACA workflow. No data rollback is required.

## Audit Evidence

- Pull request and CI results: Pending.
- Exact-SHA deployment and runtime-invariant evidence: Pending.
- Signed-in read-surface proof: Pending.

## Known Gaps

This change only corrects read-surface representation of generation history. It does not diagnose why an individual generation attempt failed or change the approval/gate contract.
