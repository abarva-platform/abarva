# 2026-07-23 — Moves Lifecycle Operator Bridge

## Release ID

`2026-07-23-moves-lifecycle-operator-bridge`

## Status

`candidate`

## Plain-English Summary

This release lets the Moves deliverable lifecycle backfill runner execute safely through the shared Azure Container Apps operator job. The runner can now receive tenant, mode, reviewed-report, and proof-output settings from environment variables, which matches the existing operator-job wrapper. It can also emit its dry-run or apply report as a proof bundle in job logs.

This does not run the backfill, apply lifecycle state, or correct any disputed Move. It only makes the governed operator path usable.

## Layer Impact

- `internal-admin`: Adds operator-job compatible configuration for the lifecycle backfill runner.
- `client-data-lane`: Enables future tenant-explicit dry-run/apply jobs, but this release itself performs no data-plane mutation.

## Client Applicability

- All clients: No user-facing runtime change.
- Specific clients: Future executions must name explicit tenants.
- Internal only: The new behavior is for AbarVa operator jobs.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/programs/backfill-deliverable-lifecycle.ts`
  - Reads `MOVES_LIFECYCLE_BACKFILL_TENANT` / `MOVES_LIFECYCLE_BACKFILL_TENANTS`.
  - Reads `MOVES_LIFECYCLE_BACKFILL_MODE`.
  - Reads `MOVES_LIFECYCLE_REVIEWED_REPORT_ID`.
  - Reads `MOVES_LIFECYCLE_BACKFILL_BATCH_SIZE`.
  - Reads `MOVES_LIFECYCLE_BACKFILL_OUT_DIR`.
  - Emits a tarred proof bundle when `MOVES_LIFECYCLE_EMIT_PROOF_BUNDLE=1`.

## QA / Validation

- PASS: `npm run moves:lifecycle-backfill -- --help`
- PASS: `npx eslint scripts/programs/backfill-deliverable-lifecycle.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- PASS: `npm run audit:architecture-rules`
- PASS: `npm run audit:enterprise-naming`
- PASS: `git diff --check`
- PASS: `npm run ops:aca-job -- --image acrabarvalab001.azurecr.io/abarva/web@sha256:6e4033a8be210e02075b7fd80b3f7016f3ffacdeed36932ad3a8a9fa7484dfa9 --script moves:lifecycle-backfill:status --env MOVES_LIFECYCLE_BACKFILL_TENANT=meridian --env MOVES_LIFECYCLE_BACKFILL_MODE=status --env MOVES_LIFECYCLE_EMIT_PROOF_BUNDLE=1 --out-dir /tmp/moves-lifecycle-operator-plan-20260723T062418Z --plan-only`

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow so the shared operator job can use the digest-pinned image. After deployment, run status/dry-run jobs only, tenant by tenant, before any apply job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release; operator job execution remains separate.
- Approved image digest: Captured by ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is internal operator plumbing with no user-facing route change.

## Rollback Plan

Revert the PR and redeploy the previous digest-pinned image. Since this release does not mutate customer data, rollback is code-only.

## Audit Evidence

- PR for this release.
- ACA main deploy run for the merged commit.
- Operator-job dry-run/status report from the first tenant-explicit execution.

## Known Gaps

- No lifecycle backfill has been applied.
- No MEMBER AI ASSIST correction has been executed.
- The first tenant-explicit operator status run still needs to be captured after deployment.
