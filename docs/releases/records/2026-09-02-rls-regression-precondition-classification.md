# 2026-09-02-rls-regression-precondition-classification - Tenant Isolation Precondition Classification

## Release ID

`2026-09-02-rls-regression-precondition-classification`

## Status

`candidate`

## Plain-English Summary

Separates a tenant-isolation suite precondition failure from a tenant-isolation failure. If required canonical tenant rows are absent, the workflow now reports `NOT CHECKED` instead of treating that setup problem as a possible cross-tenant leak verdict.

## Layer Impact

Control plane: updates the scheduled and manually dispatched CI workflow that reports tenant-isolation monitor status.

Data plane: no database changes. This only changes classification of read-only monitor output.

## Client Applicability

- All clients: Yes, as shared tenant-isolation monitoring.
- Specific clients: None.
- Internal only: Operational monitoring only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Runner marker: `scripts/run-rls-regression.ts`
- Workflow classifier: `.github/workflows/rls-regression.yml`
- Contract test: `tests/security/rls-regression-contract.test.ts`

## QA / Validation

- Pass: local classifier smoke maps the 2026-09-02 operator-job precondition output to `NOT CHECKED`.
- Pass: local YAML parse validates `.github/workflows/rls-regression.yml`.
- Pass: focused RLS regression contract test.
- Pass: Release Control Gate.
- Blocked until merge/deploy: main-branch tenant isolation workflow dispatch needs this change on `main` and in the runtime image.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys the updated image. After that deploy is healthy, dispatch the tenant isolation regression workflow from `main` and confirm a missing canonical-tenant precondition reports `NOT CHECKED`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Main deploy workflow only.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must pass in the main deploy workflow before live proof.
- Worker image invariant: Must pass in the main deploy workflow before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an internal SQL-level monitor.

## Rollback Plan

Revert the runner, workflow, and contract-test changes, then allow the repo-owned ACA deploy workflow to rebuild the prior runtime. No database rollback is required.

## Audit Evidence

- PR for this classification correction.
- Release Control Gate result.
- Main-branch tenant isolation workflow dispatch after deployment.

## Known Gaps

This does not create missing canonical tenant rows or apply migrations. If the precondition remains unmet, the correct monitor state is `NOT CHECKED`.
