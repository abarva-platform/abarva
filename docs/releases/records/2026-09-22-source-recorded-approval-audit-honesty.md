# Recorded approval audit honesty

## Release ID

`2026-09-22-source-recorded-approval-audit-honesty`

## Status

`candidate`

## Plain-English Summary

Source now distinguishes a complete recorded stage approval from a recorded
approval whose version binding or reviewer metadata is missing. The decision
stays recorded, but the readiness card shows the audit gaps and remediation
instead of saying that no further action is needed.

## Layer Impact

- `global-control-lane`
- Layer 4 product projection: Source approval readiness and decision evidence.
- No canonical data, adapter, schema, migration, or writer changes.

## Client Applicability

- All clients: Yes, on the Source event approval workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Preserve an available routed approval item for recorded-decision audit checks.
- Do not apply current-user action authorization to a past recorded decision.
- Fail closed in the mounted readiness card when record metadata is incomplete.
- Add focused projection and mounted behavior coverage.

## QA / Validation

- PASS: 3 focused suites, 50 tests.
- PASS: red-first mounted regression for missing bound decision metadata.
- PASS: mutations restoring approval precedence and past-action authorization
  each failed the intended behavior test.
- PASS: TypeScript typecheck.
- PASS: scoped ESLint.
- PASS: release-control check on the complete record.
- PENDING: hosted CI, ACA runtime proof, and signed-in replay.

## Rollout Plan

Squash-merge the green PR and allow the repository-owned ACA main deployment
workflow to build and deploy the exact merge SHA. Verify the immutable runtime
digest before the signed-in replay.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repository-owned workflow only.
- Approved image digest: Pending merge and deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned ACA main
workflow. No data or migration rollback is required.

## Audit Evidence

- Focused Jest output and mutation failures in the execution record.
- Pull request and hosted checks after opening.
- Repo-owned ACA deployment and runtime-invariant artifact after merge.
- Signed-in Source approval-workspace replay after deployment.

## Known Gaps

- Journey-phase history remains a separate authority from the 11-stage approval
  ledger and is not changed in this release.
