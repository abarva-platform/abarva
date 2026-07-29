# 2026-07-29-foundation-closure-job-hardening — Foundation Closure Job Hardening

## Release ID

`2026-07-29-foundation-closure-job-hardening`

## Status

`candidate`

## Plain-English Summary

Promotes the foundation-closure recovery lessons into the standard governed job runner and tenant execution packages. The runner now treats metric parity as a first-class governed process, blocks accidental in-memory execution fallback, verifies the runtime database boundary before writes, and sets tenant context for Postgres reads and writes so RLS-protected projections can be reconciled consistently.

## Layer Impact

- `client-data-lane`: strengthens tenant-scoped foundation jobs, publication/consumption reconciliation, and metric-parity audit execution. It does not apply review decisions or publish a new baseline by itself.
- `internal-admin`: updates reusable lab execution manifests and job topology so future tenant execution uses dedicated responsibility-specific jobs rather than a temporary recovery runner.

## Client Applicability

- All clients: No direct runtime surface change.
- Specific clients: Foundation lab execution tenants that use the shared 3C-2E job contract.
- Internal only: Yes, for governed foundation closure and future execution reuse.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/hcdn-job-runner.mjs`
- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/processing/process-handlers.mjs`
- `scripts/knowledge/__tests__/run-hcdn-job-runner-tests.mjs`
- Foundation lab job topology manifests and Bicep job definitions.
- Approved boundary snapshot image alignment.

## QA / Validation

- `node --check scripts/knowledge/hcdn-job-runner.mjs` — passed.
- `node --check scripts/knowledge/processing/executor-framework.mjs` — passed.
- `node --check scripts/knowledge/processing/process-handlers.mjs` — passed.
- `npm run test:hcdn-job-runner` — passed across fourteen governed process contracts.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` — passed after installing dependencies in the isolated recovery worktree.
- `npm run release:check` — passed.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned Azure Container Apps main workflow, verify the ACA runtime invariant, then rerun the governed metric-parity and reconciliation stages through the dedicated ACA jobs before any tenant-facing activation claim.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None from this PR outside the normal deploy workflow.
- Approved image digest: Pending after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Required later for tenant-facing provider activation; this release is job/control hardening.

## Rollback Plan

Revert the PR and redeploy the previous approved image. Since this release does not directly mutate tenant facts, rollback is code/job-contract rollback. Any already-completed governed data-plane runs must remain auditable through their existing run records and hashes.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA deploy proof: Pending.
- Governed job proof: Pending after deploy.

## Known Gaps

- This release does not apply review decisions.
- This release does not create or activate a baseline.
- This release does not activate any product provider path.
- Signed-in product proof remains a separate downstream gate after the governed data-plane state is proven.
