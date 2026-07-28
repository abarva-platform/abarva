# 2026-07-28-consumption-projection-identity-tenant — Projection Identity Tenant Binding

## Release ID

`2026-07-28-consumption-projection-identity-tenant`

## Status

`candidate`

## Plain-English Summary

The Knowledge projection rebuild now carries the tenant identifier through the enterprise identity
projection query. This fixes an operator-job failure where the projection writer referenced a tenant
column that had not been selected into the query scope.

## Layer Impact

- `client-data-lane`: Affects only baseline-bound consumption projection rebuilds run through the
  governed job lane.
- `internal-admin`: Improves operator execution reliability without approving facts, changing source
  data, or publishing a new baseline.

## Client Applicability

- All clients: Applies to shared projection execution code.
- Specific clients: None named in this public release record.
- Internal only: Governed operator execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`

## QA / Validation

- pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- pass: `npm run test:knowledge-process-executors`
- pass: `npm run release:check`
- pass: `git diff --check`

## Rollout Plan

Merge through the PR lane, deploy through the repo-owned ACA main workflow, then rerun the governed
projection-build job with a fresh run ID and idempotency key.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required before governed projection job execution.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before product-facing completion claims.

## Rollback Plan

Rollback the ACA web image to the previous approved digest. Projection rows can be rebuilt from the
active baseline with the prior approved projection builder if needed.

## Audit Evidence

- Prior failed job showed `column "tenant_key" does not exist`.
- PR URL: To be filled after PR creation.
- Governed projection rerun: Pending.

## Known Gaps

This release only fixes enterprise identity projection tenant binding. Analytics parity, Superset,
Observable, and signed-in product proof remain separate completion gates.
