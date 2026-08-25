# 2026-08-25-ecl-browser-surface-proof-denominator — ECL Browser Surface Proof Denominator

## Release ID

`2026-08-25-ecl-browser-surface-proof-denominator`

## Status

`candidate`

## Plain-English Summary

The ECL product browser smoke now reports whether all 40 named serving surfaces are visible in signed-in browser proof, not only whether the four entry routes load. This turns the prior 4-route caveat into a measured denominator: named surfaces browser-proven out of 40. A dedicated proof workflow now runs the default-route browser smoke and aVa live ablation eval after the ACA main deploy or on manual dispatch.

## Layer Impact

- `global-control-lane`: proof harness only. No schema change; the browser proof harness now tracks the 40-surface serving contract.
- Layer 5 serving/proof: no schema change; the proof harness verifies the committed serving-surface denominator.
- Layer 6 product pages/proof: no page behavior changes; the deployed proof bundle will fail if a named surface signal is missing.

## Client Applicability

- All clients: no runtime data or page behavior change.
- Specific clients: none.
- Internal only: proof harness and release validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- `.github/workflows/ecl-product-live-proof.yml`

## QA / Validation

- `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract` passed.
- `npm run ecl:product-browser:predeploy-gate` passed.
- `npm run ecl:deterministic-content:sweep` passed.

## Rollout Plan

Merge to `main`. The next repo-owned Azure Container Apps deployment will include the updated proof harness. No data load, route repointing, migration, or traffic change is introduced by this release.

After the ACA main deploy completes, `.github/workflows/ecl-product-live-proof.yml` runs the signed-in default-route proof and live aVa ablation eval. It uploads `compact-summary.json` with the entry-route, named-surface, finding, and eval denominators.

## Deployment Authority

- Repo-owned deploy workflow: standard main deploy workflow only.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by deploy workflow.
- ACA runtime invariant: required before claiming deployed proof from a new image.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming the 40-surface browser result.

## Rollback Plan

Revert the proof-harness commit. Because this release does not alter schema, data, or route behavior, rollback is code-only.

## Audit Evidence

- Local pre-deploy gate output.
- Local deterministic content sweep output.
- Future ACA browser smoke bundle containing `named_surfaces_browser_proven`.
- Future `ecl-product-live-proof` workflow artifact containing `compact-summary.json`.

## Known Gaps

This release adds the measurement. It does not by itself prove 40 of 40 surfaces in the live browser; that requires the next signed-in browser smoke run from the deployed image.
