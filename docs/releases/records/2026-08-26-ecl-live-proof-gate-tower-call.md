# 2026-08-26-ecl-live-proof-gate-tower-call — ECL Live Proof Gate Tower Call

## Release ID

`2026-08-26-ecl-live-proof-gate-tower-call`

## Status

`candidate`

## Plain-English Summary

The ECL product live proof gate now checks the Tower route for the current ECL preview call shape. A prior gate assertion expected the reader call to appear on one exact line, while the route now formats the call across multiple lines. The gate still verifies the same invariant: Tower resolves the product provider and reads the ECL preview with the canonical tenant key.

## Layer Impact

`global-control-lane`: Layer 4 product QA proof only. This changes a pre-deploy/live-proof assertion script; it does not change product behavior, schemas, tenant data, projections, or serving views.

## Client Applicability

- All clients: The proof harness is shared.
- Specific clients: None.
- Internal only: Yes, this is an operator/proof-harness change.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/run_product_ecl_predeploy_gate.mjs` now asserts `readTowerEclProjectionPreview(` and `canonicalTenantKey(effectiveClientKey)` separately instead of requiring one exact formatted call string.

## QA / Validation

- Pass: `npm run ecl:product-browser:predeploy-gate`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow may build and deploy the updated runtime image. After deployment, rerun the ECL product live proof workflow so browser and aVa baseline/ablation proof can proceed past the local proof-contract step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun `ECL product live proof`.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL and merge commit.
- `npm run ecl:product-browser:predeploy-gate` output.
- Post-deploy ACA runtime invariant.
- ECL product live proof workflow output.

## Known Gaps

This does not prove the product routes live; it only unblocks the workflow that performs that proof.
