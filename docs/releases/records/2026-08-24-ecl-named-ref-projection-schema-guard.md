# 2026-08-24-ecl-named-ref-projection-schema-guard — ECL Named-Ref Projection Schema Guard

## Release ID

`2026-08-24-ecl-named-ref-projection-schema-guard`

## Status

`candidate`

## Plain-English Summary

Adds the existing ECL projection schema reconciliation test to the no-stop ECL CI lane. The guard
reads committed DDL from a named git ref instead of the current working tree, so stale checkouts and
legacy public-schema tables cannot be mistaken for the current ECL projection contract.

## Layer Impact

- `global-control-lane`: strengthens CI proof for the ECL build lane.
- No Layer 1 source, Layer 2 adapter, Layer 3 canonical, Layer 4 product, schema, or data-plane
  mutation.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: no client-scoped data change.
- Internal only: ECL operator and CI proof.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ecl-no-stop-data-pipeline.yml`

## QA / Validation

- `pass`: `npm run test:ecl-projection-schema-reconciliation`
- `not-run`: full ECL no-stop workflow; this PR wires the named-ref guard into that workflow.
- `not-run`: signed-in browser proof; no user-facing runtime behavior changes.

## Rollout Plan

Merge through PR. Future ECL no-stop CI runs will fail early if the committed product projection DDL,
cube DDL, and source projection generator diverge for the seven declared product surfaces.

## Deployment Authority

- Repo-owned deploy workflow: not required for this CI-only change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the additional CI step.

## Audit Evidence

Pending PR and CI evidence.

## Known Gaps

This does not add new projection surfaces, child reference tables, Azure readback, or product
browser proof. It only makes the existing named-ref schema reconciliation guard part of the ECL CI
lane.
