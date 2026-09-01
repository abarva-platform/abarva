# 2026-09-01-home-chapter-synthesis-fallback — Home Chapter Synthesis Fallback

## Release ID

`2026-09-01-home-chapter-synthesis-fallback`

## Status

`candidate`

## Plain-English Summary

This change makes the Home chapter writer use its deterministic claim-based fallback when a model synthesis call returns no usable JSON. Claim-backed chapters should publish grounded prose from verified statements instead of falling through to a generic synthesis-unavailable message.

## Layer Impact

Products: Home chapter narrative assembly becomes more resilient when model prose formatting fails.

Source adapters / canonical model: No change.

Data plane: No schema or row mutation in this PR.

## Client Applicability

- All clients: Applies to Home chapter narrative assembly wherever this writer path is used.
- Specific clients: None.
- Internal only: Operator writer behavior and contract tests.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/data-build/build-home-chapters.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- Pass: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR path. The change becomes available after the standard Azure Container Apps main deployment builds and deploys the new image.

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

- Local contract test output for the Home ECL narrative layer
- Release-control check output
- Main deployment record after merge
- Operator plan-only/write/readback logs when the writer is run

## Known Gaps

This PR does not generate or persist narrative rows. It only strengthens the writer fallback used by subsequent governed operator runs.
