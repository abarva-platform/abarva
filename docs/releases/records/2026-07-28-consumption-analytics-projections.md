# 2026-07-28-consumption-analytics-projections — Consumption Projection Builder

## Release ID

`2026-07-28-consumption-analytics-projections`

## Status

`candidate`

## Plain-English Summary

The governed Knowledge projection builder now materializes the approved baseline into the shared
consumption tables needed by analytics, evidence gaps, inventory views, and product read models. It
does not approve new facts, publish a new baseline, or make analytics live by itself.

## Layer Impact

- `client-data-lane`: Reads accepted Knowledge entities, facts, relationships, metric observations,
  and evidence gaps only after an active baseline exists.
- `global-control-lane`: Updates the shared executor path that prepares baseline-bound consumption
  projections for Home, aVa, Cube, Superset, Observable, and module APIs.
- `internal-admin`: Keeps operator projection rebuilds idempotent by clearing only rows for the same
  tenant and baseline before rebuilding them.

## Client Applicability

- All clients: Applies to the shared Knowledge projection executor when run through the governed job
  lane.
- Specific clients: None named in this public release record.
- Internal only: Operator execution and proof bundle review.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## QA / Validation

- pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- pass: `npm run test:knowledge-process-executors`
- pass: `npm run test:phase3c2e-data-layer`
- pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane, deploy the digest-pinned ACA web image through the repo-owned
main deploy workflow, then rerun the governed projection-build operator job for the authorized
baseline. Analytics completion remains blocked until projection counts, metric parity, Superset,
Observable, and signed-in product proof are captured.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required before governed projection job execution.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before any product-facing analytics completion claim.

## Rollback Plan

Rollback the ACA web image to the previous approved digest. If a projection job has run, rerun the
prior approved projection builder for the same active baseline or rebuild projections from the active
baseline after rollback. No source facts, review decisions, or domain publications are mutated by
this code change.

## Audit Evidence

- PR URL: To be filled after PR creation.
- CI checks: To be filled after CI.
- Governed projection job run: Pending.
- Metric parity proof: Pending.
- Signed-in product proof: Pending.

## Known Gaps

This release does not provision Superset, deploy Cube, publish dashboards, activate product runtime
consumers, or certify the analytics phase. Those remain separate execution steps after projections
are rebuilt and reconciled.
