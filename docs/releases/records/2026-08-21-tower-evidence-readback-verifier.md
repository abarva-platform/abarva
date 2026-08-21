# 2026-08-21-tower-evidence-readback-verifier — Tower Evidence Readback Verifier

## Release ID

`2026-08-21-tower-evidence-readback-verifier`

## Status

`candidate`

## Plain-English Summary

This change adds a read-only operator verifier for the Tower evidence refresh. The verifier independently reads the Tower projection tables after a write job and confirms claim counts, observation counts, provenance rows, metric-definition coverage, and observation-reference integrity.

## Layer Impact

Lane: `client-data-lane`.

Layer 4 PRODUCTS: Tower evidence verification only. The change adds proof tooling; it does not write source data, canonical records, projection rows, migrations, routes, or UI behavior.

## Client Applicability

- All clients: Applies to shared product-lab Tower evidence refresh verification jobs after the next approved ACA image deploy.
- Specific clients: None.
- Internal only: Operator readback tooling and proof generation.
- Public/demo only: None.
- Feature flag: No feature flag; the verifier is read-only and requires database access from the operator lane.

## Changes Included

- Script: `scripts/data-build/verify-tower-value-evidence-readback.ts`
- NPM script: `data-build:tower-evidence:readback`
- Release record: `docs/releases/records/2026-08-21-tower-evidence-readback-verifier.md`

## QA / Validation

- `npx eslint scripts/data-build/verify-tower-value-evidence-readback.ts` passed locally.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.
- Database readback proof must run inside the private ACA operator lane after merge/deploy.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy a digest-pinned image, independently read back the ACA runtime invariant, then run the read-only Tower evidence readback job inside the private operator lane.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared web/operator image.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required before using the new image as readback proof.
- Worker image invariant: Operator job must run the approved digest-pinned image.
- Feature/env flag update path: No persistent flag change.
- Live signed-in proof required: Required before claiming product-surface proof; not required for this verifier-only patch.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. This removes the verifier script only; it does not alter existing Tower projection data.

## Audit Evidence

- Local lint output.
- Post-merge ACA deploy logs and runtime-invariant readback.
- Tower readback operator job request, logs, summary, and idle verification output.

## Known Gaps

This release does not perform migration work, traffic cutover outside the repo-owned deploy path, product-route browser proof, or changes to recorded source and canonical data.
