# 2026-08-03-source-cube-vendor-semantic-rollup — Source Cube vendor semantic rollup

## Release ID

`2026-08-03-source-cube-vendor-semantic-rollup`

## Status

`candidate`

## Plain-English Summary

Repairs the Source vendor Cube semantic view so it remains one row per vendor while preserving full portfolio measures. The prior semantic view selected one representative row per vendor, which satisfied primary-key uniqueness but undercounted vendor annual value and contract count.

## Layer Impact

- `client-data-lane`: replaces `consumption.sourcing_vendor_semantic_v1` with an aggregate semantic view over `consumption.sourcing_vendor_v1`. No source rows are inserted, updated, or deleted.
- `Layer 4 products`: keeps Cube primary-key correctness for vendor exploration while reconciling vendor measures to the governed Source contract portfolio.
- `internal-admin`: supports the ACA operator `source:cube:verify-live` proof path.

## Client Applicability

- All clients: applies to future Source sourcing consumption/Cube views.
- Specific clients: validated in lab against the current approved synthetic dataset.
- Internal only: verifier and lab proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260803210500_source_cube_vendor_semantic_rollup.sql`

## QA / Validation

- Pass: ACA operator Source Cube parity verifier reached the semantic gate and failed only on vendor annual value and contract-count reconciliation.
- Pass: replacement view keeps one row per vendor and aggregates annual value, total committed value, auto-renew count, and contract count.
- Pass: migration includes a replay-safe duplicate vendor-key assertion.
- Pass: lab operator dry apply caught a view contract type mismatch before the Cube verifier ran; the migration now preserves the existing count column types.
- Pass: fresh migration replay caught the opposite historical type path; the migration now rebuilds only the derived semantic view so every environment ends with one contract.
- Not-run: PR CI checks; will run after PR creation.
- Not-run: ACA operator migration apply in lab; runs after merge/deploy.
- Not-run: ACA operator Source Cube parity verifier in lab; runs after merge/deploy and migration apply.

## Rollout Plan

Merge to `main`. Let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. Apply the vendor semantic rollup migration through the ACA operator job in lab, then rerun `source:cube:verify-live` against the approved synthetic tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: enforced by the repo-owned deploy workflow.
- Worker image invariant: enforced by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no, data-plane/Cube semantic verification change only.

## Rollback Plan

If the aggregate view is wrong, add a corrective migration that replaces `consumption.sourcing_vendor_semantic_v1`. No source data rollback is required.

## Audit Evidence

- ACA operator verifier run showing the semantic mismatch between the representative-row vendor view and the live Source portfolio totals.
- PR and CI checks for this change.
- ACA operator migration logs for applying `20260803210500_source_cube_vendor_semantic_rollup.sql`.
- ACA operator verifier logs from `source:cube:verify-live`.

## Known Gaps

This release does not deploy a standalone Cube API/runtime. It repairs the Postgres consumption contract required by the declared Cube model.
