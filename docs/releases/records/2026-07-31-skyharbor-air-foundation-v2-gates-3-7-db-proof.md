# 2026-07-31-skyharbor-air-foundation-v2-gates-3-7-db-proof — Preserve DB-gate repairs and evidence for isolated Foundation V2 execution

## Release ID

`2026-07-31-skyharbor-air-foundation-v2-gates-3-7-db-proof`

## Status

`candidate`

## Plain-English Summary

This release preserves the fixes proven during skyharbor-air's isolated Foundation V2 database execution. Review apply now repairs stale stored candidate hashes before the governance guard, without weakening decision-hash validation. The Postgres role-plan generator now includes the least-privilege grants later gates required: publisher write access to governed evidence gaps, and evaluator write access to the reconciliation ledger.

The release also records the Gates 3-7 database evidence: accepted review decisions, Knowledge promotion, domain publication, baseline activation, consumption projections, reconciliation audit, and metric parity. It does not claim signed-in product-surface proof.

## Layer Impact

Client-data-lane: Foundation V2 database execution, review apply, publication, baseline, projection, reconciliation, and tenant-scoped role grants.

Internal-admin: ACA job runner support code and generated Postgres readiness artifacts for lab execution lanes.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` evidence record; generated Postgres readiness artifacts for existing lab readiness packages.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`: repairs null or stale stored candidate hashes before review apply guards.
- `scripts/knowledge/build-phase2b3c-postgres-plan.mjs`: adds least-privilege publisher/evaluator grants required by later publication and audit gates while preserving the existing airline-specific reviewer canonical promotion grant.
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`: adds stale stored hash repair coverage.
- `scripts/knowledge/__tests__/run-phase2b3c-postgres-plan-tests.mjs`: asserts the new grant contract.
- `clients/*/18-phase2b3c-azure-lab-implementation/12-postgres-security-plan/phase2b3c2c-postgres-readiness.sql`: regenerated from the updated plan generator.
- `clients/skyharbor-air/execution/skyharbor-air-foundation-v2-gates-3-7-db-proof-2026-07-31.md`: evidence summary for the isolated DB run.

## QA / Validation

- Pass: `npm run generate:hcdn-postgres-plan`
- Pass: `npm run test:knowledge-process-executors`
- Pass: `npm run test:hcdn-postgres-plan`
- Pass: `npm run test:hcdn-job-runner`

## Rollout Plan

Merge to `main` through the protected PR path. Let `.github/workflows/aca-main-deploy.yml` build and deploy the digest-pinned ACA image. After the new image is live, rerun the affected isolated skyharbor-air job path with the repo-owned image and capture post-deploy readback before claiming the runtime image carries the repair.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from local commands in this release.
- Approved image digest: Assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify template image and 100% traffic revision image match the deployed digest before using the image as proof.
- Worker image invariant: Rerun affected skyharbor-air ACA jobs with the deployed digest before claiming job-image closure.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before any product-surface readiness claim.

## Rollback Plan

Revert this release before or after merge if validation fails. If the image has deployed, allow the repo-owned ACA deploy workflow to roll forward with the revert commit and verify the ACA runtime invariant again. Do not edit live review decisions, baselines, or reconciliation rows in place; supersede with a new governed job run if data-plane evidence must be corrected.

## Audit Evidence

- Local DB evidence summary: `clients/skyharbor-air/execution/skyharbor-air-foundation-v2-gates-3-7-db-proof-2026-07-31.md`
- Focused local tests listed in QA / Validation.
- Live DB run evidence summarized in the evidence record.

## Known Gaps

- Signed-in product-surface proof is not complete.
- The shared app runtime has not been updated until this release is merged and the repo-owned ACA workflow completes.
- Cube/API/UI live parity remains a downstream runtime proof step; this release only preserves the database-gate and code-repair evidence.
