# 2026-08-30-tower-serving-lens-scope — Tower Serving Lens Scope

## Release ID

`2026-08-30-tower-serving-lens-scope`

## Status

`candidate`

## Plain-English Summary

Tower serving views now keep value-proof, cost, evidence, and risk lenses scoped to the active
assessment generation and to the page each lens requested. This prevents stale or unrelated rows
from appearing in lens-level readbacks.

## Layer Impact

Layer 4 Products, `global-control-lane`: updates Tower serving functions only. No Layer 1 intake,
Layer 2 adapter output, Layer 3 canonical object, or cube row is changed.

## Client Applicability

- All clients: yes, for Tower serving views that read the shared Layer 4 projection functions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Migration `20260830234500_tower_serving_remaining_lens_scope.sql`.
- NPM dry/apply scripts for the migration.
- Read-only serving probe widened to inspect the remaining Tower lens row functions.
- Regression coverage for active-generation and page-key predicates.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/tower/__tests__/case-attribute-widening.test.ts`
- `npm run release:check`
- Azure dry run and apply must be executed by the ACA operator job with a digest-pinned image.
- Layer 4 readback must pass after apply.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deployment publish the digest-pinned image,
run the migration dry script, run the migration apply script, and rerun the Layer 4 readback.

## Deployment Authority

- Repo-owned deploy workflow: required for the runtime image.
- Shared runtime mutators: none outside the approved ACA operator job migration path.
- Approved image digest: assigned by the main deploy workflow.
- ACA runtime invariant: required before applying the migration.
- Worker image invariant: required through the shared deploy workflow and operator wrapper.
- Feature/env flag update path: none.
- Live signed-in proof required: not required for the SQL migration itself; product readback is required.

## Rollback Plan

Restore the prior serving function definitions with a follow-up migration, then rerun the Layer 4
readback. Because this migration changes serving functions only, no product rows or canonical facts
need to be deleted.

## Audit Evidence

- Pull request and CI checks.
- ACA deploy evidence for the merged commit.
- Operator job dry-run, apply, and readback output directories.

## Known Gaps

The projection and serving schema still needs a complete baseline migration so future read-path
changes do not have to patch deployed function bodies from observation.
