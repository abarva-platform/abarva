# 2026-08-27-ecl-multi-tenant-product-proof — ECL Multi-Tenant Product Proof

## Release ID

`2026-08-27-ecl-multi-tenant-product-proof`

## Status

`candidate`

## Plain-English Summary

The ECL product browser proof harness can now validate more than one active proof tenant. It resolves the selected tenant's display name, proof email, canonical Home preview key, and Source vendor-count signature before running the live browser smoke.

The aVa consultant evaluation remains scoped to the healthcare fixture case bank. Browser proofs for other ECL proof tenants record that eval as not applicable instead of treating the missing fixture-specific eval as a product-browser failure.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 products: updates the product proof harness and proof workflow only.
- Data layers: no schema, loader, projection, serving-view, or source data changes.
- Runtime access: no product access grant changes and no tenant-isolation weakening.

## Client Applicability

- All clients: no.
- Specific clients: active ECL proof tenants using the governed private browser proof lane.
- Internal only: yes, proof and QA automation only.
- Public/demo only: no public route behavior change.
- Feature flag: not a product feature flag.

## Changes Included

- `.github/workflows/ecl-product-live-proof.yml`
- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- `scripts/ecl/write_ecl_product_live_proof_compact_summary.mjs`

## QA / Validation

Pass:

- `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `node --check scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- `node --check scripts/ecl/write_ecl_product_live_proof_compact_summary.mjs`
- `git diff --check`
- `npm run ecl:product-browser:predeploy-gate`

## Rollout Plan

Merge through the protected PR path. The next repo-owned ACA main deploy will publish the updated proof harness into the web image. After deployment, dispatch `ECL product live proof` with the selected tenant key to capture browser proof from the private operator lane.

## Deployment Authority

- Repo-owned deploy workflow: required for the web image that carries this proof-harness update.
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the repo-owned ACA main deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: unchanged.
- Feature/env flag update path: unchanged.
- Live signed-in proof required: yes, for the selected tenant after deployment.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy lane. Product routes and loaded data remain unchanged by the rollback.

## Audit Evidence

Inspect the PR, release gate output, `npm run ecl:product-browser:predeploy-gate`, the ACA deploy run, and the tenant-scoped `ECL product live proof` workflow run after deployment.

## Known Gaps

The consultant answer evaluation is not generalized across all tenant profiles. It remains intentionally scoped to the healthcare fixture case bank until tenant-specific eval cases are authored.
