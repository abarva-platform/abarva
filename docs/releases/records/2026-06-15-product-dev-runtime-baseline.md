# 2026-06-15-product-dev-runtime-baseline — Product Dev Runtime Baseline

## Release ID

`2026-06-15-product-dev-runtime-baseline`

## Status

`candidate`

## Plain-English Summary

Product Dev now has a real Azure runtime smoke baseline in its own subscription:
observability resources, a Container Apps environment, a managed identity, and a
scale-to-zero HTTPS smoke app. This does not deploy the real AbarVa product app,
does not copy secrets, and does not touch client data.

## Layer Impact

- `global-control-lane`: Adds Product Dev environment infrastructure scaffolding
  and evidence for AbarVa product/control-plane development.
- `internal-admin`: Updates Azure environment trackers, evidence, and Downloads
  review artifacts for founder/operator review.

## Client Applicability

- All clients: No direct client runtime impact.
- Specific clients: None.
- Internal only: Product Dev Azure environment setup only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Product Dev runtime Bicep:
  - `infra/azure/product-dev-runtime-foundation.bicep`
  - `infra/azure/product-dev-containerapps-smoke.bicep`
  - `infra/azure/parameters/product-dev-runtime.bicepparam`
- Product Dev Azure evidence:
  - `docs/build/azure/2026-06-15-product-dev-finish/summary.md`
  - `docs/build/azure/2026-06-15-product-dev-finish/*`
- Tracker updates:
  - `docs/azure/AZURE_ENVIRONMENT_MASTER_TRACKER_2026-06.md`
  - `docs/azure/AZURE_ENVIRONMENT_MASTER_TRACKER_2026-06.json`
  - `docs/azure/ENVIRONMENT_SETUP_EXECUTION_STATUS_2026-06.md`

## QA / Validation

- pass: `az bicep build --file infra/azure/product-dev-containerapps-smoke.bicep`
- pass: `az bicep build --file infra/azure/product-dev-runtime-foundation.bicep`
- pass: `az deployment sub what-if` for Product Dev runtime baseline.
- pass: `az deployment sub create` for Product Dev runtime baseline.
- pass: HTTPS smoke check returned `HTTP/2 200` for
  `ca-abv-pdev-smoke-eus1.redwave-653318c8.eastus.azurecontainerapps.io`.
- pass: `npm run azure:cost-circuit-breaker:check -- --subscriptions product-dev=58eef48c-3ed6-48e6-9af4-de1848ad3401 --output docs/build/azure/2026-06-15-product-dev-finish/cost-circuit-breaker`
- pass: Downloads workbook snapshot rendered and had no formula errors.
- blocked: management-group placement and management-group policy baseline
  remain blocked by Azure management-group permissions.
- not-run: real AbarVa app deployment and Product Dev synthetic data rehearsal
  were intentionally not run in this slice.
- not-run: `docs/build/production-readiness.json` was not rewritten because this
  is a Product Dev environment setup slice, not a production deployment
  promotion.

## Rollout Plan

This is already active in the Product Dev Azure subscription under the approved
Product Dev mutation window. The repo change records the IaC, evidence, and
tracker updates in a PR before merging to `main`.

## Rollback Plan

If Product Dev runtime spend or behavior needs to be rolled back, delete the
smoke Container App, Container Apps environment, Product Dev managed identity,
and Product Dev observability resources created by the deployment. Do not delete
the subscription, budget, or placeholder Key Vault unless a separate cleanup
approval exists.

## Audit Evidence

- `docs/build/azure/2026-06-15-product-dev-finish/summary.md`
- `docs/build/azure/2026-06-15-product-dev-finish/product-dev-runtime-whatif.json`
- `docs/build/azure/2026-06-15-product-dev-finish/product-dev-runtime-deploy-summary.json`
- `docs/build/azure/2026-06-15-product-dev-finish/smoke-http-head.txt`
- `docs/build/azure/2026-06-15-product-dev-finish/cost-circuit-breaker/cost-circuit-breaker-report.md`

## Known Gaps

- Management group placement remains blocked by Azure permissions.
- Product Dev baseline policy assignments remain pending.
- GitHub `product-dev` environment secrets are not wired.
- The real AbarVa application image is not deployed to Product Dev.
- Product Dev synthetic data load/retrieval rehearsal is not run.
