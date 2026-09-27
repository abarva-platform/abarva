# 2026-09-27-moves-deliverable-worker-request-import-boundary — Moves Deliverable Worker Import Boundary

## Release ID

`2026-09-27-moves-deliverable-worker-request-import-boundary`

## Status

`candidate`

## Plain-English Summary

The deliverable generation worker must run as an Azure Container Apps Job under the React server condition. A shared tenant resolver imported request-only Clerk and Next.js modules at file load time, so worker startup could fail before it reached the queue. This change keeps the resolver behavior intact for signed-in request handlers while loading request-only modules only inside the helper calls that need them.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Moves deliverable generation can resume through the existing queue worker path.
- Source adapters / canonical model: No schema, adapter, tenant-data, or canonical model changes.
- Control plane: Adds a regression test for the worker import boundary under the ACA `react-server` condition.

## Client Applicability

- All clients: Yes, for queued Moves deliverable generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/tenant/resolveTenant.ts` now dynamically loads request-only cookie and Clerk modules inside request-session helper calls instead of importing them at module load.
- `src/scripts/__tests__/process-deliverable-queue-worker-boundary.test.ts` proves the queue worker imports under `--conditions=react-server`.
- `docs/architecture/test-ci-coverage-census.json` regenerated after adding the test file.

## QA / Validation

- `npx jest src/scripts/__tests__/process-deliverable-queue-worker-boundary.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts src/lib/tenant/__tests__/resolveTenant.test.ts --runInBand` — pass.
- `npx tsx --conditions=react-server src/scripts/process-deliverable-queue.ts` — no longer fails during module import; local run reaches the expected database-connection precondition when no local database URL is configured.
- `npm run typecheck` — pass.
- `npm run lint` — pass with existing warnings, 0 errors.
- `npm run audit:test-ci-coverage:write && npm run audit:test-ci-coverage:check` — pass.

## Rollout Plan

Merge through the protected `main` branch. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to the shared Product/Lab web and worker runtimes.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, confirm a queued Moves deliverable build is processed and exposes the governed sign-off path.

## Rollback Plan

Revert this release commit and redeploy through the repo-owned ACA main deploy workflow. No migration rollback or data repair is required.

## Audit Evidence

- PR URL: To be added when opened.
- CI: To be added when run.
- Deploy workflow: To be added after merge.
- Runtime invariant proof: To be added after deploy.
- Signed-in proof: To be added after deploy.

## Known Gaps

This release only fixes the worker startup boundary. It does not by itself prove that any already queued run completed after deployment; that is covered by the required post-deploy worker invariant and signed-in product proof.
