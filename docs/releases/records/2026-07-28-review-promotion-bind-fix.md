# 2026-07-28-review-promotion-bind-fix — Review Promotion SQL Bind Fix

## Release ID

`2026-07-28-review-promotion-bind-fix`

## Status

`candidate`

## Plain-English Summary

Fixes a guarded review-promotion executor defect where one relationship promotion statement sent an unused SQL bind parameter. The change allows the approved review-decision promotion job to fail or pass on the actual data rules instead of stopping on a driver-level bind mismatch.

## Layer Impact

- Canonical model: fixes the promotion executor path that writes accepted relationship assertions after review approval.
- Operations: keeps the governed ACA job path unchanged; this is a code fix for the existing controlled execution lane.

## Client Applicability

- All clients: no direct product-surface change.
- Specific clients: applies to the current isolated tenant execution lane when the governed job is rerun.
- Internal only: execution tooling and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`

## QA / Validation

- Pass: `npm run test:knowledge-process-executors`
- Pass: `npm run test:hcdn-job-runner`
- Pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- Pass: `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. The governed job must then be rerun with a new run id and idempotency key.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: assigned by deploy workflow after merge
- ACA runtime invariant: required after deploy before rerunning the job
- Worker image invariant: required after deploy before rerunning the job
- Feature/env flag update path: none
- Live signed-in proof required: not for this execution-tooling fix

## Rollback Plan

Revert this PR and redeploy the previous digest. If a governed job is running during rollback, stop the job first and rerun with a fresh idempotency key after the rollback decision.

## Audit Evidence

- Pull request and CI checks for this release record.
- Governed job logs from the subsequent rerun.
- Reconciliation report after the rerun completes.

## Known Gaps

- This PR does not apply review decisions, publish domains, assemble baselines, build projections, or expose runtime product surfaces.
