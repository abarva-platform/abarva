# 2026-09-01-home-ecl-visible-terminal-normalization — Home ECL Visible Terminal Normalization

## Release ID

`2026-09-01-home-ecl-visible-terminal-normalization`

## Status

`candidate`

## Plain-English Summary

This change tightens the Home ECL narrative writer so non-visible limitation metadata does not rewrite claim-backed chapter prose into a terminal-state message. Visible headline and synthesis text are still checked and rejected if they contain terminal or refusal-style language.

## Layer Impact

Products: Home narrative generation keeps verified chapter prose visible when the supporting claims exist.

Source adapters / canonical model: No change.

Data plane: No schema or row mutation in this PR.

## Client Applicability

- All clients: Applies to Home ECL narrative generation wherever this operator writer is used.
- Specific clients: None.
- Internal only: Operator writer behavior and contract tests.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` passed locally.

## Rollout Plan

Merge through the protected PR path. The change becomes available to operator narrative jobs after the normal Azure Container Apps main deployment publishes the new image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime deployment.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the normal main deployment workflow after merge.
- ACA runtime invariant: Must be verified after deployment before runtime claims.
- Worker image invariant: Operator jobs should run the deployed digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming product-visible narrative recovery.

## Rollback Plan

Revert this commit and redeploy through the normal main lane. No database rollback is required.

## Audit Evidence

- PR #7280
- Local contract test output for the Home ECL narrative layer
- Main deployment record after merge
- Operator plan-only/write/readback logs when the writer is run

## Known Gaps

This PR does not generate or persist narrative rows. It only fixes the writer guard so a subsequent governed operator run can pass the visible-quality gate when claims are present.
