# 2026-09-10-ecl-product-live-proof-diagnostics — ECL Product Live Proof Diagnostics

## Release ID

`2026-09-10-ecl-product-live-proof-diagnostics`

## Status

`released; live-proven`

## Plain-English Summary

The ECL product browser smoke now requests the operator diagnostics lane when it proves hidden
serving-surface and finding markers. Source and Intelligence now expose the same diagnostics path
as the adjacent products, while the default executive pages remain unchanged for ordinary users.

## Layer Impact

- Layer 4 Products: Source and Intelligence diagnostics rendering is aligned with the existing
  proof-only panels used by the shared ECL surface contract.
- Control lane: the ECL product browser smoke route list now exercises those diagnostics markers
  during live proof instead of expecting every marker to be visible on default executive pages.
- Data plane: no data, schema, migration, loader, or serving-view change is included.

## Client Applicability

- All clients: the diagnostics query behavior is available on shared product routes.
- Specific clients: none.
- Internal only: the affected markers are operator proof surfaces.
- Public/demo only: none.
- Feature flag: none; diagnostics are requested explicitly through the existing query lane.

## Changes Included

- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/intelligence/page.tsx`

## QA / Validation

- `npm run ecl:product-browser:predeploy-gate` — PASS.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` — PASS.
- `npx eslint scripts/ecl/run_product_ecl_browser_smoke.mjs src/app/'(maestro)'/source/preview/workspace/WorkspaceClient.tsx src/app/'(maestro)'/intelligence/page.tsx` — PASS.
- `npx tsc --noEmit` — PASS.
- `git diff --check` — PASS.
- PR checks for #7532 — PASS.
- ACA deploy run `34441258100` for merge SHA `b1dd611601b0735a1cf2be469c852b8b1b9fb67d` — PASS.
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

Inspect pull request #7532, local validation output, ACA deploy workflow runs `34441258100` and
`34442823605`, runtime invariant proof, and ECL product live proof run `34443822224`.

## Known Gaps

This release fixes the proof route contract. It does not redesign any executive product page or
change the ECL finding definitions.
