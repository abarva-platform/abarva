# 2026-08-28-demo-moves-phase-capture-subtype-readback — Demo Moves Phase-Capture Readback

## Release ID

`2026-08-28-demo-moves-phase-capture-subtype-readback`

## Status

`candidate`

## Plain-English Summary

This release tightens the data-build readback for the demo Moves activation load. The proof query now counts phase-capture module rows by their phase-capture module key shape, instead of treating every module with the same activation provenance as a phase-capture row.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 — Source adapters and loaders: no source rows or generated activation rows change.
- Layer 3 — Canonical/persisted execution state: no schema or loaded-data shape changes.
- Layer 4 — Products: no route or UI behavior changes; this only corrects the operator proof contract for the Moves activation job.

## Client Applicability

- All clients: no.
- Specific clients: demo tenant activation lane only.
- Internal only: operator proof and readback.
- Public/demo only: demo Moves activation proof.
- Feature flag: none.

## Changes Included

- `scripts/ecl/execute_meridian_phs_moves_activation_load.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`

## QA / Validation

- `npm run test:ecl-meridian-phs-moves-activation-execute` passed.
- `npm run test:ecl-meridian-phs-moves-activation` passed.
- `git diff --check` passed.

## Rollout Plan

Merge by pull request, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the governed ACA operator job with the digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: required before shared runtime image claims.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required before rerunning the operator job.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: after the governed operator job succeeds.

## Rollback Plan

Revert the PR and redeploy the previous healthy image. No database rollback is required because this change only narrows readback counting logic.

## Audit Evidence

- Pull request and CI checks.
- ACA main deploy evidence after merge.
- Governed ACA operator job output after deploy.

## Known Gaps

This does not change the demo Moves data itself, and it does not make claimable value rows appear; those remain gated by the Tower value-proof rules.
