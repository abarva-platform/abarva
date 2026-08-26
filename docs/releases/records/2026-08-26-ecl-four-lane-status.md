# 2026-08-26-ecl-four-lane-status — ECL Completion Status Contract

## Release ID

`2026-08-26-ecl-four-lane-status`

## Status

`candidate`

## Plain-English Summary

Adds a committed, machine-readable ECL completion status contract so operators and agents report
four separate lanes instead of one blended progress number. The status distinguishes product
cutover, product proof, legacy cleanup, and client-intake adapter readiness.

## Layer Impact

Layer 4 Products: Records product cutover and proof denominators from explicit browser/eval proof
artifacts. No product runtime behavior changes.

Operations / release control: Adds a status generator and CI coverage for the four-lane status
contract. The product live-proof workflow now emits the same status JSON into its proof artifact.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: None.
- Internal only: ECL operators and agents use the four-lane status artifact for progress reporting.
- Public/demo only: No route or public page change.
- Feature flag: None.

## Changes Included

- `docs/architecture/ecl-four-lane-completion-status.json`
- `scripts/ecl/write_ecl_four_lane_completion_status.mjs`
- `scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`
- `docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md`
- `.github/workflows/ecl-no-stop-data-pipeline.yml`
- `.github/workflows/ecl-product-live-proof.yml`
- `package.json`

## QA / Validation

- PASS: `npm run test:ecl-four-lane-status`
- PASS: `npm run test:ecl-projection-schema-reconciliation`
- PASS: `git diff --check`

## Rollout Plan

Merge through a pull request. No ACA deployment, data load, migration, feature flag, route repoint,
or traffic change is required. Future ECL product live-proof runs emit
`ecl-four-lane-completion-status.json` into the uploaded proof artifact.

## Deployment Authority

- Repo-owned deploy workflow: Not used by this release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this release changes status/proof reporting only.

## Rollback Plan

Revert this PR. The rollback removes the four-lane status generator, its workflow hooks, and the
committed status snapshot. Runtime product behavior is unchanged.

## Audit Evidence

- Four-lane status contract test output.
- Projection schema reconciliation output.
- Prior product live-proof run referenced in the committed status artifact.

## Known Gaps

This release does not retire legacy data-plane assets and does not add the remaining client-intake
adapters. Those remain tracked as separate lanes in the status artifact.
