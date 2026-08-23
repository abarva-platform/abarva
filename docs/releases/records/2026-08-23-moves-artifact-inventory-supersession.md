# 2026-08-23-moves-artifact-inventory-supersession — Moves artifact inventory and supersession correction

## Release ID

`2026-08-23-moves-artifact-inventory-supersession`

## Status

`candidate`

## Plain-English Summary

Corrects the Moves generated-artifact inventory path so cleanup, File Cabinet, and workspace listings include generated artifacts stored under either accepted Move reference convention and either client identifier convention. It also fixes generated-artifact supersession for older rows that stored their logical key as `artifactId` or `registryKey` instead of `deliverableTypeKey`, so a refreshed artifact replaces the prior current row rather than appearing beside it.

## Layer Impact

- `global-control-lane`: updates shared Moves artifact repository, operator, and listing behavior.
- Layer 4 products: Moves artifact cleanup/listing becomes consistent across the operator, File Cabinet API, and workspace adapter. No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, tenant registry, product routing, or source/canonical data is mutated by the code change.

## Client Applicability

- All clients: Applies to Moves generated-artifact listing and supersession behavior.
- Specific clients: None named in this public record.
- Internal only: Operator execution remains internal/admin.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `src/lib/artifacts/repository.ts`
- `scripts/moves/refresh-persisted-artifact-cleanliness.ts`
- `src/app/api/v1/programs/[programId]/artifacts/route.ts`
- `src/lib/workspace-explorer/moves-adapter.ts`
- `src/lib/deliverables/client-facing-artifact-sanitize.ts`
- Focused tests for repository and sanitizer behavior.

## QA / Validation

- `npx jest src/lib/artifacts/__tests__/repository.test.ts --runInBand` — passed.
- `npx jest 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts --runInBand` — passed.
- Additional TypeScript, release, and post-deploy operator proof to be captured before this record is marked released.

## Rollout Plan

Merge through PR review and allow the repo-owned ACA main deploy workflow to build/deploy. After deploy, run the Moves artifact-cleanliness operator in dry-run mode first, then apply only if the broadened inventory reports clean refreshable artifacts and no non-refreshable blockers.

## Deployment Authority

- Repo-owned deploy workflow: yes, main merge triggers the approved ACA deploy workflow.
- Shared runtime mutators: none in this code change.
- Approved image digest: captured by ACA deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no; operator and File Cabinet API readback are the proof paths for this internal cleanup.

## Rollback Plan

Revert the PR to restore the prior selection/supersession behavior. Any operator-created generated-artifact rows are append-only versions and can be superseded by a later governed refresh if needed.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6756
- ACA deploy run: pending.
- Operator dry-run/apply/post-apply reports: pending.

## Known Gaps

None known for the scoped inventory/supersession correction.
