# 2026-09-10-ecl-product-live-proof-diagnostics — ECL Product Live Proof Diagnostics

## Release ID

`2026-09-10-ecl-product-live-proof-diagnostics`

## Status

`candidate`

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

This release fixes the proof route contract. It does not redesign any executive product page or
change the ECL finding definitions.
