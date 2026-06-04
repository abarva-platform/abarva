# 2026-06-04-lakeshore-private-plane-container-app-namefix - Lakeshore Container App Name Fix

## Release ID

`2026-06-04-lakeshore-private-plane-container-app-namefix`

## Status

`candidate`

## Plain-English Summary

The Lakeshore private-data-plane deployment reached Azure Container Apps validation and failed because generated smoke/web Container App names were longer than Azure allows. This release shortens only those generated Container App names so the private-plane deployment can continue without changing existing resource group, network, database, storage, Key Vault, Search, or Service Bus names.

## Layer Impact

- `client-data-lane`: Updates the client tenant Azure IaC naming contract for the Lakeshore private data-plane path.
- `global-control-lane`: The shared reusable client tenant Bicep template changes for future client deployments that use long client/environment names.

## Client Applicability

- All clients: Future client private-data-plane deployments benefit from valid Container App names.
- Specific clients: Lakeshore Holdings private-data-plane deployment is the immediate target.
- Internal only: Azure pilot operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `infra/azure/client-tenant-foundation.bicep`: Generate shorter placeholder and web Container App names with `ca-<client>-<environment>-smoke` and `ca-<client>-<environment>-web`.
- `docs/releases/records/2026-06-04-lakeshore-private-plane-container-app-namefix.md`: Release record.

## QA / Validation

- PASS: `az bicep build --file infra/azure/client-tenant-foundation.bicep`.
- PASS: `POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD=<from Key Vault> az bicep build-params --file infra/azure/parameters/lakeshore.pilot.bicepparam`.
- PASS: `POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD=<from Key Vault> AZURE_DEPLOYMENT_NAME=lakeshore-private-data-plane-namefix2-whatif-<timestamp> scripts/lakeshore/deploy-private-data-plane.sh what-if`; what-if creates `Microsoft.App/containerApps/ca-lakeshore-pilot-smoke` and does not repeat the Container App name validation failure.
- Pending: `npm run release:check -- --base origin/main --head HEAD` after commit.
- Pending: Lakeshore private-data-plane deployment rerun after merge.

## Rollout Plan

Merge to `main`, allow normal production deployment, then rerun `scripts/lakeshore/deploy-private-data-plane.sh deploy` with the existing Lakeshore Postgres administrator password sourced from Key Vault.

## Rollback Plan

Revert this release to restore the previous generated names. That would also restore the Azure Container App validation failure for long client/environment names, so rollback should only be used if a different naming contract is introduced immediately.

## Audit Evidence

- Failed Azure deployment: `lakeshore-private-data-plane-rerun-20260604104955`.
- Failure code: `ContainerAppInvalidName`.
- Follow-up PR and CI evidence to be attached after merge.
- Azure RBAC remediation completed before this slice: `sp-abarva-codex-lab` now has `Key Vault Secrets Officer` on `kvlakeshorepilotlsh001`, allowing reuse of the existing `postgres-lakeshore-admin-password` secret without rotating it.

## Known Gaps

- This does not change app runtime image wiring; Lakeshore pilot parameters still set `deployAppRuntime = false`.
