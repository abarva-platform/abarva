# 2026-08-03-source-context-verifier-schema-alignment — Source verifier schema alignment

## Release ID

`2026-08-03-source-context-verifier-schema-alignment`

## Status

`candidate`

## Plain-English Summary

Aligns Source verification scripts with the established contract/vendor read-model column contract. The existing portfolio read model exposes supplier identity as `vendor_ref`; newer consumption projections may expose the same value as `vendor_id`. The verifier now compares each layer using its own declared column names.

## Layer Impact

- `client-data-lane`: Source verification only. No schema or product behavior changes; the change aligns readback checks with the existing read-model column contract.
- `internal-admin`: improves post-migration operator checks so they validate deployed read models without assuming a newer alias exists in older views.

## Client Applicability

- All clients: verification behavior only where these scripts are used.
- Specific clients: None.
- Internal only: Source migration/readback operator workflows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/source/verify-sourcing-context-depth.mjs`
- `scripts/source/compare-skyharbor-live-lab-postgres.mjs`

## QA / Validation

- Pass: `node --check scripts/source/verify-sourcing-context-depth.mjs`
- Pass: `node --check scripts/source/compare-skyharbor-live-lab-postgres.mjs`
- Pass: `npx eslint scripts/source/verify-sourcing-context-depth.mjs scripts/source/compare-skyharbor-live-lab-postgres.mjs`
- Blocked pending rollout: operator readback rerun requires this fix to be merged and deployed into the digest-pinned ACA image.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. Operator readback jobs should use the deployed digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: enforced by the repo-owned deploy workflow.
- Worker image invariant: enforced by the repo-owned deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: No, script-only verification fix.

## Rollback Plan

Revert the PR if the verifier behavior is incorrect. No database rollback is required.

## Audit Evidence

- PR and CI checks for this change.
- Operator readback logs from the next Source verification run.

## Known Gaps

The verifier fix has passed local syntax and lint checks, but the operator readback must be rerun after the merged image is deployed. This PR does not stand up a separate Cube runtime; it only unblocks the Source consumption-view verification path used by the Cube semantic model.
