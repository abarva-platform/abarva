# 2026-07-28-consumption-projection-cleanup-sequencing — Projection Cleanup Sequencing

## Release ID

`2026-07-28-consumption-projection-cleanup-sequencing`

## Status

`candidate`

## Plain-English Summary

The Knowledge projection rebuild now clears stale consumption rows with one prepared statement per
projection table. This fixes the operator-job failure where Postgres rejected a multi-command
prepared statement before rebuilding analytics projections.

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
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

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

- Prior failed job showed `cannot insert multiple commands into a prepared statement`.
- PR URL: To be filled after PR creation.
- Governed projection rerun: Pending.

## Known Gaps

This release only fixes projection cleanup execution. Analytics parity, Superset, Observable, and
signed-in product proof remain separate completion gates.
