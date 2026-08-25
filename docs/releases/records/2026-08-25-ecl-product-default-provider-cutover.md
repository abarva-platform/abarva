# 2026-08-25-ecl-product-default-provider-cutover — ECL Product Default Provider Cutover

## Release ID

`2026-08-25-ecl-product-default-provider-cutover`

## Status

`candidate`

## Plain-English Summary

Home preview, Source workspace, Tower, and Intelligence now default to the governed ECL serving
provider instead of requiring an explicit ECL query parameter. The existing ECL proof query remains
compatible, and an environment rollback can restore the pre-ECL provider without mutating data.

## Layer Impact

- Layer 4 Products: product routes resolve the ECL provider by default for the scoped ECL surfaces.
- Layer 5 Serving: routes continue to read through `serving.*` views; no product page reads raw
  ECL projection tables directly.
- Azure/data plane: no schema, load, migration, or table-retirement action is included.

## Client Applicability

- All clients: product route provider resolution changes where ECL serving rows exist.
- Specific clients: ECL proof behavior is validated against the current proof tenant only.
- Internal only: deterministic content sweep and pre-deploy gates.
- Public/demo only: none.
- Feature flag: `ECL_PRODUCT_DEFAULT_PROVIDER=legacy` restores the pre-ECL default. Explicit legacy
  query override remains disabled unless `ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE=true`.

## Changes Included

- Adds `src/lib/ecl/product-provider.ts` as the shared product provider resolver.
- Repoints Home preview, Tower, and Intelligence ECL panel selection to the shared resolver.
- Makes Source workspace default to the Azure ECL serving provider while preserving explicit
  Source rollback/local-provider modes.
- Extends the ECL product browser smoke to distinguish opt-in proof routes from bare default routes.
- Adds `scripts/ecl/run_ecl_deterministic_content_sweep.mjs` and npm scripts for Gate 1
  deterministic content verification.
- Adds a runtime-safe default-route browser smoke script for ACA operator proof runs, where
  repository documentation files are not packaged into the runtime image.

## QA / Validation

- `npm run ecl:deterministic-content:sweep` — passed locally.
  - Serving surface contract: 40/40, with Home 16, Tower 9, Source 9, Intelligence 6.
  - Findings declared: 10/10.
  - Default-route browser proof remains pending until deployment.
- `npx jest --runTestsByPath src/lib/ecl/__tests__/product-provider.test.ts src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts --runInBand` — passed locally.
- The deterministic sweep runs `npm run ecl:product-browser:predeploy-gate`, which passed locally.
- First ACA operator proof attempt used the deterministic sweep script and failed before browser
  launch because the runtime image does not include the plan document under `docs/architecture/`.
  Follow-up validation uses `ecl:product-browser:smoke:default`, which is the browser-only default
  route proof runner intended for the runtime image.

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the
digest-pinned image. After deployment, run the product browser smoke in default-route mode and
capture signed-in proof before claiming default-route cutover is live-proven.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual shared runtime mutation; use the repo-owned ACA workflow.
- Approved image digest: produced by the ACA main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: only rollback to `ECL_PRODUCT_DEFAULT_PROVIDER=legacy` if needed.
- Live signed-in proof required: yes, using default bare routes.

## Rollback Plan

Set `ECL_PRODUCT_DEFAULT_PROVIDER=legacy` and redeploy through the approved ACA workflow, or revert
this PR and redeploy the previous healthy digest. No data rollback is required because this release
does not mutate ECL, legacy tables, serving views, or source records.

## Audit Evidence

- PR for this release.
- Local deterministic content sweep output.
- Local focused provider tests.
- ACA main deploy run, runtime invariant proof, and default-route browser smoke proof after merge.

## Known Gaps

- Legacy data-plane retirement remains out of scope.
- Intake-to-ECL adapter coverage remains out of scope.
- Default-route browser proof is not claimed until captured after deployment.
