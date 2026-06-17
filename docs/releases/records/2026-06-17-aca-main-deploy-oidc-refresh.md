# ACA Main Deploy OIDC Refresh

## Release ID

`2026-06-17-aca-main-deploy-oidc-refresh`

## Status

`candidate`

## Plain-English Summary

Fixes the Azure Container Apps main deploy workflow so Azure authentication is refreshed after the long ACR image build and before the workflow resolves the pushed image digest.

## Layer Impact

- **Release lane:** `internal-admin`.
- **CI/CD layer:** Adds a second `azure/login` step after `az acr build`.
- **Runtime layer:** No application runtime behavior change.
- **Data layer:** No database or tenant data change.

## Client Applicability

- **All clients:** Deployment reliability only.
- **Specific clients:** No client-specific runtime behavior.
- **Internal only:** Yes, deployment pipeline.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `.github/workflows/aca-main-deploy.yml` refreshes Azure OIDC login after the ACR build completes.

## QA / Validation

- `npm run release:check -- --base origin/main --head HEAD` is required before merge.
- The motivating failure was ACA main deploy run `27663939322`: image build succeeded, but `Resolve image digest` failed because the Azure OIDC assertion expired during the build.

## Rollout Plan

Merge to `main`. The next `ACA main deploy` run will build the image, refresh Azure login, resolve the digest, deploy the revision, shift traffic, and verify production health.

## Rollback Plan

Revert this workflow-only change. No runtime or schema rollback is required.

## Audit Evidence

- Branch: `codex/aca-deploy-refresh-azure-login`.
- Previous deploy failure log showed `AADSTS700024: Client assertion is not within its valid time range` during digest resolution.

## Known Gaps

None known. This release only addresses the deploy workflow authentication refresh; it does not alter the app image contents or the Container Apps runtime configuration.
