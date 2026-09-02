# 2026-09-02-rls-regression-operator-job — Tenant Isolation Regression Operator Job

## Release ID

`2026-09-02-rls-regression-operator-job`

## Status

`candidate`

## Plain-English Summary

Updates the SQL-level tenant isolation regression workflow so its read-only probe runs through the private operator job path. The runtime image now includes the specific SQL fixture directory required by the runner.

## Layer Impact

Control plane: updates the scheduled and manually dispatched CI workflow that checks database-level tenant isolation.

Data plane: read-only probe only. The SQL uses temporary tables and SELECT statements; it does not apply migrations or write product data.

Runtime packaging: adds `tests/security` to the container image because the regression runner reads `tests/security/rls-regression.sql` at execution time.

## Client Applicability

- All clients: Yes, as shared tenant-isolation monitoring.
- Specific clients: None.
- Internal only: Operational monitoring only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/7317
- Workflow: `.github/workflows/rls-regression.yml`
- Runtime packaging: `Dockerfile`

## QA / Validation

- Pass: PR checks validated the workflow surface before this release record was added.
- Pass: local YAML parse validates `.github/workflows/rls-regression.yml`.
- Pass: focused tests cover the RLS regression contract and operator-job command construction.
- Pass: `scripts/ops/submit-aca-operator-job.mjs --plan-only` validates the operator-job command shape with the existing `db-migrate` job container.
- Blocked until merge and deploy: full live proof requires merge to `main`, the repo-owned ACA deploy workflow to build a new digest-pinned image containing `tests/security`, and then a main-branch dispatch of this workflow.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys the updated image. After that deploy is healthy, dispatch the tenant isolation regression workflow from `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Main deploy workflow only.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must pass in the main deploy workflow before live proof.
- Worker image invariant: Must pass in the main deploy workflow before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal SQL-level monitor.

## Rollback Plan

Revert the workflow and Dockerfile change on `main`, then allow the repo-owned ACA deploy workflow to rebuild the prior runtime packaging. No database rollback is required.

## Audit Evidence

- PR #7317.
- Release Control Gate result after this record is added.
- Repo-owned ACA deploy run for the merge commit.
- Initial main-branch workflow dispatch after the new image is deployed.
- Uploaded workflow artifact `rls-regression-<run_id>`.

## Known Gaps

The operator job currently exposes only the control database secret reference. The context target reports `NOT CHECKED` until a dedicated context database secret is added to the operator job.
