# 2026-08-03-source-cube-view-contract-repair — Source Cube view contract repair

## Release ID

`2026-08-03-source-cube-view-contract-repair`

## Status

`candidate`

## Plain-English Summary

Repairs two consumption-view columns that the first Source Cube parity run proved were missing from the live database contract. The Source tables already carried the data; this change exposes those fields at the governed consumption boundary used by Cube.

## Layer Impact

- `client-data-lane`: appends `timing_window` to `consumption.sourcing_opportunity_v1` and `service_scope` to `consumption.sourcing_event_v1`. No source data is inserted, updated, or deleted.
- `Layer 4 products`: unblocks the Source Cube parity verifier for the declared semantic model dimensions.
- `internal-admin`: supports the ACA operator `source:cube:verify-live` proof path.

## Client Applicability

- All clients: applies to future Source sourcing consumption/Cube views.
- Specific clients: validated against the current SkyHarbor synthetic tenant.
- Internal only: verifier and lab proof.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260803202000_source_cube_view_contract_repair.sql`

## QA / Validation

- Pass: static comparison identified missing Cube-declared dimensions `timing_window` and `service_scope`.
- Pass: migration safety scan found no destructive statements.
- Not-run: PR CI checks; will run after PR creation.
- Not-run: ACA operator migration apply in lab; runs after merge/deploy.
- Not-run: ACA operator Source Cube parity verifier in lab; runs after merge/deploy and migration apply.

## Rollout Plan

Merge to `main`. Let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. Apply the view-contract migration through the ACA operator job in lab, then rerun `source:cube:verify-live` against `skyharbor_global`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: enforced by the repo-owned deploy workflow.
- Worker image invariant: enforced by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no, data-plane/Cube semantic verification change only.

## Rollback Plan

If the appended columns are wrong, add a corrective migration that replaces the affected consumption views. No source data rollback is required.

## Audit Evidence

- Failed ACA operator verifier run showing `column "timing_window" does not exist`.
- PR and CI checks for this change.
- ACA operator migration logs for applying `20260803202000_source_cube_view_contract_repair.sql`.
- ACA operator verifier logs from `source:cube:verify-live`.

## Known Gaps

This release does not deploy a standalone Cube API/runtime. It repairs the Postgres consumption contract required by the declared Cube model.
