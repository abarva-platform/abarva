# 2026-08-28-home-ecl-narrative-readback — Home ECL Narrative Readback

## Release ID

`2026-08-28-home-ecl-narrative-readback`

## Status

`candidate`

## Plain-English Summary

This change adds a read-only operator proof for the Home ECL narrative writer seam. It verifies that
the Home projection has model-generated chapter summaries and linked chapter-claim rows after the
governed writer job runs.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no change.
- Layer 4 product projection: read-only proof over existing Home projection rows.
- Operator/proof layer: adds an npm script that emits a structured readback event.

## Client Applicability

- All clients: available wherever the Home ECL narrative writer seam is used.
- Specific clients: none.
- Internal only: operator readback proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/readback_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- `package.json`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `npm run test:npm-script-targets` — passed.
- `git diff --check` — passed.
- `npm run release:check` — passed after this release record was updated with explicit QA status.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then run
`npm run ecl:home-narrative:readback` through the governed ACA operator job with a digest-pinned
image and Key Vault-backed database secret.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required before using the new script in the operator job.
- Worker image invariant: required by the deploy workflow.
- Live signed-in proof required: separate from this readback.

## Rollback Plan

Revert the PR to remove the readback script. It does not write data and leaves previously generated
projection rows untouched.

## Audit Evidence

- PR checks for this change.
- ACA operator readback summary event after the script runs inside the VNet.

## Known Gaps

This proof confirms projection writeback state only. It does not prove the live Home browser route
renders the generated narrative; signed-in browser proof remains a separate lane.
