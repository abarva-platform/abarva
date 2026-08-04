# 2026-08-03-source-cube-parity-gate — Source Cube parity gate

## Release ID

`2026-08-03-source-cube-parity-gate`

## Status

`candidate`

## Plain-English Summary

Adds an executable Source Cube parity gate for the first Source sourcing semantic model. The gate proves the Cube model is packaged in the ACA image, points only at governed consumption views, keeps tenant context required, and reconciles Cube-facing measures back to the loaded Source contract portfolio.

## Layer Impact

- `client-data-lane`: adds a semantic-grain vendor consumption view for Cube so one vendor equals one Cube primary key. It does not mutate source data.
- `Layer 4 products`: hardens the Cube semantic model and adds a verifier for model-to-Postgres parity. This does not deploy a standalone Cube API service.
- `internal-admin`: extends ACA operator verification with a Source Cube parity command.

## Client Applicability

- All clients: applies to future Source sourcing Cube deployments using these semantic definitions.
- Specific clients: validated against the current SkyHarbor synthetic tenant.
- Internal only: verifier and packaging gate.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260803200500_source_sourcing_vendor_semantic_grain.sql`
- `cube/model/source_sourcing.yml`
- `scripts/source/verify-source-cube-parity.mjs`
- `Dockerfile`
- `package.json`

## QA / Validation

- Pass: local syntax check for `scripts/source/verify-source-cube-parity.mjs`.
- Pass: local ESLint check for `scripts/source/verify-source-cube-parity.mjs`.
- Pass: Cube YAML parses as 8 cubes and 9 views, with `sourcing_vendors` bound to `consumption.sourcing_vendor_semantic_v1`.
- Pass: migration safety scan found no destructive statements in `20260803200500_source_sourcing_vendor_semantic_grain.sql`.
- Not-run: PR CI checks; will run after PR creation.
- Not-run: ACA operator migration apply in lab; runs after merge/deploy.
- Not-run: ACA operator Source Cube parity verifier in lab; runs after merge/deploy and migration apply.

## Rollout Plan

Merge to `main`. Let the repo-owned Azure Container Apps main deploy workflow build and deploy the image. Apply the semantic vendor-grain migration through the ACA operator job in lab, then run `source:cube:verify-live` against the lab database.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: enforced by the repo-owned deploy workflow.
- Worker image invariant: enforced by the repo-owned deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: no, data-plane/Cube semantic verification change only.

## Rollback Plan

Revert the Cube model and verifier changes. If the semantic vendor view is wrong after application, add a corrective migration that replaces or drops `consumption.sourcing_vendor_semantic_v1`. No source data rollback is required.

## Audit Evidence

- PR and CI checks for this change.
- ACA deploy evidence for the digest-pinned image.
- ACA operator migration logs for applying `20260803200500_source_sourcing_vendor_semantic_grain.sql`.
- ACA operator verifier logs from `source:cube:verify-live`.

## Known Gaps

This release still does not deploy a standalone Cube runtime/API. It proves the semantic model, model packaging, tenant rewrite contract, and Cube-facing SQL parity against Postgres consumption views.
