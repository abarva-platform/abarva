# 2026-09-21-source-stage-plan-snapshot — Source Stage-Plan Snapshot Projection

## Release ID

`2026-09-21-source-stage-plan-snapshot`

## Status

`candidate`

## Plain-English Summary

This release adds a read-only Source event stage-plan snapshot projection. Given a Source event row and a requested tenant key, the projection returns an immutable in-memory plan for the event's current sourcing journey, including owner, current stage, visible stages, stage statuses, and a deterministic content hash.

This is the D-008 path. It does not activate requests, apply migrations, write tenant data, or claim that any live migration has been applied.

## Layer Impact

`global-control-lane`, Layer 4 product projection only.

No Layer 1 client intake, Layer 2 adapter, Layer 3 canonical model, schema, migration, tenant data, approval action, model prompt path, export path, cube path, or live runtime behavior is changed.

## Client Applicability

- All clients: Source product code receives the projection after merge.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/new-workspace/stage-plan-snapshot.ts` adds a guarded read-only snapshot builder and reader for `source_events`.
- `src/lib/source/new-workspace/stage-plan-snapshot.test.ts` covers immutable projection, deterministic hashing, journey adaptation, opposite-tenant denial, and fail-closed invalid rows.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` builds the snapshot from the already-authorized Source event detail and uses it as the current-stage projection source with a fail-closed fallback.
- `EXECUTION_STATUS.md` records the narrow D-008 claim and explicitly leaves live migration and signed-in proof unclaimed.
- `reports/data-standard/legacy-purge/*` was refreshed by `npm run release:check`; the allowed historical-reference count decreased from 590 to 588.

## QA / Validation

Red-first:

- Before implementation, `npx jest src/lib/source/new-workspace/stage-plan-snapshot.test.ts --runInBand` failed because `./stage-plan-snapshot` did not exist.

Focused passing validation:

- `npx jest src/lib/source/new-workspace/stage-plan-snapshot.test.ts --runInBand` passed 4 of 4 tests.
- `npx jest 'src/app/(maestro)/source/new/[eventId]/page.test.tsx' src/lib/source/new-workspace/stage-plan-snapshot.test.ts --runInBand` passed 4 of 4 tests.
- `npx jest src/lib/source/new-workspace/stage-plan-snapshot.test.ts src/lib/source/new-workspace/phase-state.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts --runInBand` passed 42 of 42 tests.
- `npm run audit:lib-orphans` passed with no baseline change.
- `npx eslint 'src/app/(maestro)/source/new/[eventId]/page.tsx' src/lib/source/new-workspace/stage-plan-snapshot.ts src/lib/source/new-workspace/stage-plan-snapshot.test.ts` passed with no output.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.

Mutation check:

- Temporarily bypassing the tenant guard changed an opposite-tenant read into an available snapshot and failed the focused suite. The guard was restored and the suite passed again.

## Rollout Plan

Open a PR and merge through the protected GitHub path after validation and CI. The repo-owned ACA main deploy workflow will build and deploy the merge SHA as usual. No manual runtime command, migration apply, feature flag, tenant-data mutation, export job, cube rebuild, or data-build job is part of this rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before any deployed claim.
- Worker image invariant: Required after deploy before any deployed claim.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not claimed by this release.

## Rollback Plan

Revert the PR. The read-only stage-plan snapshot helper and its tests disappear. No data rollback is required because this release adds no migration and performs no tenant-data writes.

## Audit Evidence

- Local red-first and passing Jest output listed above.
- Mutation result listed above.
- PR URL, CI checks, merge SHA, and deploy workflow evidence to be added after those stages happen.

## Known Gaps

- D-006 request activation remains out of scope until the required activation authority exists and is proven applied.
- No migration was applied or inspected through a live database connection in this worktree.
- No live signed-in browser proof, ACA runtime invariant proof, cube proof, export proof, or aVa proof is claimed.
