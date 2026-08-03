# 2026-08-03-source-cube-quality-state-contract — Source Cube quality-state contract

## Release ID

`2026-08-03-source-cube-quality-state-contract`

## Status

`candidate`

## Plain-English Summary

Repairs the next Source Cube model/view mismatch found by the lab verifier. The governed opportunity view already carried the source quality state as `authority_state`; this release also exposes it as `quality_state`, matching the Cube semantic model.

## Layer Impact

- `client-data-lane`: appends `quality_state` to `consumption.sourcing_opportunity_v1`. No source data is inserted, updated, or deleted.
- `Layer 4 products`: unblocks the Source Cube parity verifier for the declared opportunity dimensions.
- `internal-admin`: supports the ACA operator `source:cube:verify-live` proof path.

## Client Applicability

- All clients: applies to future Source sourcing consumption/Cube views.
- Specific clients: validated against the current synthetic airline tenant.
- Internal only: verifier and lab proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260803204500_source_cube_quality_state_contract.sql`

## QA / Validation

- Pass: ACA operator Source Cube parity verifier reached the next drift and failed on `column "quality_state" does not exist`.
- Pass: static view/model inspection confirmed `quality_state` is declared by Cube and available in `source.sourcing_opportunity`.
- Not-run: PR CI checks; will run after PR creation.
- Not-run: ACA operator migration apply in lab; runs after merge/deploy.
- Not-run: ACA operator Source Cube parity verifier in lab; runs after merge/deploy and migration apply.

## Rollout Plan

Merge to `main`. Let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. Apply the quality-state view migration through the ACA operator job in lab, then rerun `source:cube:verify-live` against the synthetic airline tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: enforced by the repo-owned deploy workflow.
- Worker image invariant: enforced by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no, data-plane/Cube semantic verification change only.

## Rollback Plan

If the appended column is wrong, add a corrective migration that replaces `consumption.sourcing_opportunity_v1`. No source data rollback is required.

## Audit Evidence

- Failed ACA operator verifier run showing `column "quality_state" does not exist`.
- PR and CI checks for this change.
- ACA operator migration logs for applying `20260803204500_source_cube_quality_state_contract.sql`.
- ACA operator verifier logs from `source:cube:verify-live`.

## Known Gaps

This release does not deploy a standalone Cube API/runtime. It repairs the Postgres consumption contract required by the declared Cube model.
