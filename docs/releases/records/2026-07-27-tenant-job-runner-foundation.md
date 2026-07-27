# 2026-07-27-tenant-job-runner-foundation — Tenant Job Runner Foundation

## Release ID

`2026-07-27-tenant-job-runner-foundation`

## Status

`candidate`

## Plain-English Summary

Adds the shared executable runner that future private data-plane jobs will call before any tenant source processing begins. The runner validates the tenant boundary, process name, environment, database, storage account, subscription, and digest-pinned images, then emits a standard audit envelope. The runtime image now packages only approved boundary snapshots for job preflight; it does not copy full client workspaces. Runtime images may roll forward by digest through the normal deploy lane; strict equality to the boundary snapshot image is available only when `ABARVA_HCDN_STRICT_IMAGE_LOCK=true`. This release does not apply Azure resources, run migrations, parse sources, load data, or wire any product surface.

## Layer Impact

- Release lane: `global-control-lane`
- Source adapters / job execution: Introduces the shared runner contract used by future governed data-build jobs.
- Canonical model: No schema or data changes.
- Products: No Home, Intelligence, Moves, Source, Tower, Learn, or Pricing runtime changes.

## Client Applicability

- All clients: Shared runner code can be reused by tenant-scoped private data planes once separately approved.
- Specific clients: None activated by this release.
- Internal only: Yes, until a governed Azure apply and data-plane migration are separately approved.
- Public/demo only: No public behavior changes.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/hcdn-job-runner.mjs`
- `scripts/knowledge/__tests__/run-hcdn-job-runner-tests.mjs`
- `package.json` script `test:hcdn-job-runner`
- `Dockerfile` runtime packaging for approved boundary snapshots only

## QA / Validation

- `npm run test:hcdn-job-runner` — passed. Covers all thirteen approved process contracts, preflight/no-op modes, tenant wildcard/list rejection, manifest mismatch, packaged boundary snapshot resolution, database/storage mismatch, digest-pinned rolling runtime images, optional strict image lock, and execute-mode network ordering.
- `npm run release:check` — pending for PR validation.

## Rollout Plan

Merge to main through a PR. The normal application image may include the runner after merge, but no data-plane Azure apply, database migration, source parse/load, or tenant activation is authorized by this release.

## Deployment Authority

- Repo-owned deploy workflow: Normal main deploy only, if merged.
- Shared runtime mutators: None.
- Approved image digest: Not assigned in this code-only candidate.
- ACA runtime invariant: Required only if a normal app deploy occurs after merge.
- Worker image invariant: Required before any future ACA job execution.
- Feature/env flag update path: None.
- Live signed-in proof required: No product-surface proof required for this runner-only change.

## Rollback Plan

Revert the PR to remove the runner and package script. No database rollback, Azure rollback, or tenant data cleanup is required because this release does not mutate tenant data or Azure resources.

## Audit Evidence

- PR URL: pending.
- Test output: `npm run test:hcdn-job-runner`
- Runner audit envelope: emitted by `scripts/knowledge/hcdn-job-runner.mjs` in preflight/no-op/execute modes.

## Known Gaps

- Azure apply remains blocked.
- Database migration remains unauthorized.
- Source landing, parsing, and data loading remain unauthorized.
- Future tenant manifests and private-network hardening remain separate follow-up lanes.
