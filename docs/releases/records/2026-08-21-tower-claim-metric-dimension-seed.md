# 2026-08-21-tower-claim-metric-dimension-seed — Tower Claim Metric Dimension Seed

## Release ID

`2026-08-21-tower-claim-metric-dimension-seed`

## Status

`candidate`

## Plain-English Summary

This change makes the Tower evidence refresh writer seed metric definition rows for every metric referenced by a claim, even when that claim does not yet have a writable observation row. A claim can be validly recorded as not ready because its measurement period is missing; the metric dimension still has to exist so the claim can reference it without violating the database relationship.

## Layer Impact

Lane: `client-data-lane`.

Layer 4 PRODUCTS: Tower evidence projection writer only. The change affects the operator refresh job that writes Tower projection tables; it does not alter recorded source files, canonical build logic, migrations, routing, or UI behavior.

## Client Applicability

- All clients: Applies to shared product-lab Tower evidence refresh jobs after the next approved ACA image deploy.
- Specific clients: None.
- Internal only: Operator refresh tooling and proof generation.
- Public/demo only: None.
- Feature flag: Existing write approvals still gate database mutation.

## Changes Included

- Script: `scripts/data-build/refresh-tower-value-evidence.ts`
- Release record: `docs/releases/records/2026-08-21-tower-claim-metric-dimension-seed.md`

## QA / Validation

- `npm run data-build:tower-evidence -- --out-dir /tmp/tower-evidence-claim-metric-dimension-dry-run` passed in dry-run mode.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.
- Database write proof remains an ACA operator-job action, not a local command.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy a digest-pinned image, independently read back the ACA runtime invariant, then rerun the approved Tower evidence refresh job inside the private operator lane.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared web/operator image.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required before using the new image as refresh proof.
- Worker image invariant: Operator job must run the approved digest-pinned image.
- Feature/env flag update path: No persistent flag change.
- Live signed-in proof required: Required before claiming product-surface proof; not required for this writer-only compatibility patch.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Any already-written Tower projection rows remain governed by the refresh build version and can be superseded by rerunning the previous approved writer image if needed.

## Audit Evidence

- Dry-run output: `/tmp/tower-evidence-claim-metric-dimension-dry-run`
- Post-merge ACA deploy logs and runtime-invariant readback
- Tower operator job request, logs, summary, and idle verification output

## Known Gaps

This release does not perform migration work, traffic cutover outside the repo-owned deploy path, product-route browser proof, or changes to recorded source and canonical data.
