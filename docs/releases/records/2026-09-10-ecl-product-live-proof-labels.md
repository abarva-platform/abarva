# 2026-09-10-ecl-product-live-proof-labels — ECL Product Live Proof Labels

## Release ID

`2026-09-10-ecl-product-live-proof-labels`

## Status

`released; live-proven`

## Plain-English Summary

The ECL product browser smoke now accepts the current executive labels for two surfaces whose
names changed after the original proof contract was written. This keeps browser proof aligned to
the product vocabulary without making proof-only wording visible on default pages.

## Layer Impact

- Control lane: the live browser smoke assertion contract now recognizes the current Home and Tower
  labels for existing proof surfaces.
- Layer 4 Products: no product UI, data reader, route, or rendering behavior changes.
- Data plane: no data, schema, migration, loader, or serving-view change is included.

## Client Applicability

- All clients: applies to shared proof automation only.
- Specific clients: none.
- Internal only: yes, this is a proof-harness assertion update.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`

## QA / Validation

- PASS — `npm run ecl:product-browser:predeploy-gate`.
- PASS — `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract`.
- PASS — `npx eslint scripts/ecl/run_product_ecl_browser_smoke.mjs scripts/ecl/run_product_ecl_predeploy_gate.mjs`.
- PASS — `git diff --check`.
- PASS — `npm run release:check`.
- PR checks for #7534 — PASS.
- ACA deploy run `34442660760` for merge SHA `0f31e2ea7992c34e756bb24393ff62efd9b8ad42` — PASS.
- Carried forward into active main SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`.
- Runtime invariant on active digest `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160` — PASS.
- ECL product live proof run `34443822224` — PASS: 4/4 default entry routes, 40/40 named surfaces, 10/10 demonstrable findings, and 13/13 aVa evaluated answers accepted.

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the digest-pinned image. After deployment, run the repo-owned ECL product live proof
workflow and capture the structured browser smoke event.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160` on active SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`.
- ACA runtime invariant: PASS on active revision `ca-abarva-web-lab-eastus--mb9a0225d`.
- Worker image invariant: PASS for required worker jobs on the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, through the ECL product live proof workflow.

## Rollback Plan

Revert the pull request and redeploy the prior digest-pinned image through the repo-owned ACA
workflow. No data rollback is required.

## Audit Evidence

Inspect pull request #7534, local validation output, ACA deploy workflow runs `34442660760` and
`34442823605`, runtime invariant proof, and ECL product live proof run `34443822224`.

## Known Gaps

This release only aligns proof assertions with current product labels. It does not make a new claim
about visual quality, product information architecture, or the underlying ECL data content.
