# 2026-08-23-moves-artifact-currentness-proof — Moves artifact currentness proof correction

## Release ID

`2026-08-23-moves-artifact-currentness-proof`

## Status

`candidate`

## Plain-English Summary

Clarifies generated Move artifact currentness in the File Cabinet and cleanup
operator. Superseded generated artifacts now report as superseded instead of
board-ready in all-version API responses, and the artifact-cleanliness operator
reports current generated-artifact count separately from scanned output files and
superseded generated rows.

## Layer Impact

- `global-control-lane`: updates shared Moves artifact listing and internal
  operator reporting.
- Layer 4 products: Moves File Cabinet and operator proof output become clearer.
  No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, tenant registry,
  product routing, Source/canonical data, or client tenant data is changed by the
  code change.

## Client Applicability

- All clients: Applies to Moves generated-artifact currentness display and
  operator reporting.
- Specific clients: None named in this public record.
- Internal only: Operator execution remains internal/admin.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts`
- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts`
- `scripts/moves/refresh-persisted-artifact-cleanliness.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' --runInBand` — passed.
- `npx eslint scripts/moves/refresh-persisted-artifact-cleanliness.ts 'src/app/api/v1/programs/[programId]/artifacts/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts'` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.

## Rollout Plan

Merge through PR review and allow the repo-owned ACA main deploy workflow to
build/deploy. After deploy, rerun the Moves artifact-cleanliness operator in
dry-run mode and confirm the summary reports current artifact counts and
superseded generated rows separately.

## Deployment Authority

- Repo-owned deploy workflow: yes, main merge triggers the approved ACA deploy
  workflow.
- Shared runtime mutators: none in this code change.
- Approved image digest: captured by ACA deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no; File Cabinet API/readback and operator
  proof are sufficient for this internal currentness-reporting correction.

## Rollback Plan

Revert the PR to restore the prior File Cabinet status mapping and operator
summary fields. Generated-artifact row data is append-only and unaffected by this
code rollback.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6757
- ACA deploy run: pending.
- Operator dry-run report: pending.

## Known Gaps

This record does not perform a new artifact refresh; it makes currentness and
superseded-row reporting unambiguous before the next operator proof.
