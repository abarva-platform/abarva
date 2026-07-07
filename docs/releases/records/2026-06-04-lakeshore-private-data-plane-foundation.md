# 2026-06-04-lakeshore-private-data-plane-foundation — Lakeshore Tenant + Private Data Plane Foundation

## Release ID

`2026-06-04-lakeshore-private-data-plane-foundation`

## Status

`candidate`

## Plain-English Summary

This release makes Lakeshore Holdings a first-class pilot tenant in the app and prepares its private Azure data-plane foundation. The app can now recognize Lakeshore by client key, email domain, display name, industry code, and broker/substrate tenant key. The Azure runbook and parameter file define a repeatable deployment path for the Lakeshore private data plane without storing secrets in the repository.

## Layer Impact

- `global-control-lane`: Adds `DIVERSIFIED` as a supported industry code and registers Lakeshore in shared tenant/client routing maps.
- `client-data-lane`: Adds Lakeshore's broker/substrate key (`lakeshore-holdings`) and Azure parameter/runbook artifacts for the private data-plane foundation.
- `internal-admin`: Adds operator scripts and runbook steps for deploying or tearing down the Lakeshore pilot resource groups.

## Client Applicability

- All clients: Existing tenant behavior is unchanged except the onboarding script now supports `DIVERSIFIED`.
- Specific clients: Lakeshore Holdings receives a shell-only tenant identity and private data-plane deployment path.
- Internal only: Azure deploy/teardown scripts and runbook are for AbarVa operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Registered `lakeshore` in `ALL_CLIENTS`, DB-name aliases, industry-code mapping, email-domain inference, tenant alias profiles, demo data-tier status, and canonical auth roster.
- Added `DIVERSIFIED` to onboarding, engagement creation, Tower seed typing, setup vocabulary, and demo-data pattern generation.
- Updated tenant alias, tenant-key, tenant-isolation, setup-vocabulary, and Azure IaC verifier coverage.
- Added `infra/azure/parameters/lakeshore.pilot.bicepparam`.
- Added `scripts/lakeshore/deploy-private-data-plane.sh` and `scripts/lakeshore/teardown-private-data-plane.sh`.
- Added `docs/runbooks/lakeshore-private-data-plane.md`.
- Updated Azure Postgres foundation defaults to allowlist `VECTOR` for pgvector-backed context retrieval.

## QA / Validation

Validation status before merge:

- PASS: `npx jest --runTestsByPath src/__tests__/behaviors/tenant-onboarding.test.ts src/lib/tenant/__tests__/resolveTenant.test.ts src/lib/admin/__tests__/tenant-key-consistency.test.ts src/__tests__/unit/tenant-keys.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/lib/admin/__tests__/setup-vocab.test.ts --runInBand`
- PASS: `npm run azure:client-tenant-iac:verify`
- PASS: `az bicep build --file infra/azure/client-tenant-foundation.bicep`
- PASS: `az bicep build-params --file infra/azure/parameters/lakeshore.pilot.bicepparam`
- PASS: `npx eslint src/lib/client-config.ts src/lib/tenant/aliases.ts src/scripts/tenants/add-tenant.ts src/scripts/demo-data/patterns.ts src/app/api/engagements/create/turn/route.ts src/app/api/tower/seed-demo/route.ts src/lib/admin/setup-vocab.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` after CI is green. The application deploy will make Lakeshore recognizable to control-plane code, but the tenant remains shell-only until the Phase C synthetic data generation and governed Data Loads workflow runs. The Azure private data-plane resources are created only when an operator runs `scripts/lakeshore/deploy-private-data-plane.sh deploy` with a one-time `POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD`.

## Rollback Plan

Revert the PR to remove Lakeshore from app-level tenant registries and remove the runbook/parameter/script artifacts. If Azure resources have already been deployed, export audit evidence first, then use `CONFIRM=delete-lakeshore-pilot scripts/lakeshore/teardown-private-data-plane.sh` to delete the pilot resource groups.

## Audit Evidence

- PR URL and CI run for this release.
- `npm run azure:client-tenant-iac:verify` output.
- `az bicep build` and `az bicep build-params` output.
- Deployment outputs from `az deployment sub show --query "properties.outputs"` after Azure deployment.
- Clerk org/user creation evidence once human provisioning is complete.

## Known Gaps

- This release does not generate or load Lakeshore synthetic records or contract PDFs.
- This release does not create the production Clerk organization/user by itself.
- This release does not execute the Azure deployment automatically; it provides the governed runbook and scripts.
