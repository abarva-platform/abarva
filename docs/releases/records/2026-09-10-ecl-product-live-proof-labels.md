# 2026-09-10-ecl-product-live-proof-labels — ECL Product Live Proof Labels

## Release ID

`2026-09-10-ecl-product-live-proof-labels`

## Status

`candidate`

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

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and
deploys the digest-pinned image. After deployment, run the repo-owned ECL product live proof
workflow and capture the structured browser smoke event.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, through the ECL product live proof workflow.

## Rollback Plan

Revert the pull request and redeploy the prior digest-pinned image through the repo-owned ACA
workflow. No data rollback is required.

## Audit Evidence

Inspect the pull request, local validation output, ACA deploy workflow run, runtime invariant
proof, and the post-deploy ECL product live proof workflow run.

## Known Gaps

This release only aligns proof assertions with current product labels. It does not make a new claim
about visual quality, product information architecture, or the underlying ECL data content.
