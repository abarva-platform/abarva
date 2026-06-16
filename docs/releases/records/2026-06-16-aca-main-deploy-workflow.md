# 2026-06-16-aca-main-deploy-workflow — Azure Container Apps Main Deploy Workflow

## Release ID

`2026-06-16-aca-main-deploy-workflow`

## Status

`candidate`

## Plain-English Summary

Merging code to `main` now has an explicit Azure Container Apps deployment path instead of relying on a manual follow-up. The new workflow builds the exact merged commit into an Azure Container Registry image, deploys the pinned image digest to the shared production Container App, waits for the new revision to become healthy, shifts traffic, and records deployment evidence. The production crawl now runs after that deploy workflow succeeds, so it checks the new revision rather than racing against the old one.

## Layer Impact

- `global-control-lane`: changes the shared release/deployment control path for the production Admin and product surfaces served by `app.abarva.ai`.
- `internal-admin`: improves operator evidence for Azure Container Apps revisions, traffic shift, image digest, and health status.

## Client Applicability

- All clients: yes, because the shared `app.abarva.ai` control plane is deployed through this path.
- Specific clients: none.
- Internal only: deployment operators and release reviewers.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/aca-main-deploy.yml`: new main-branch and manual workflow that uses Azure OIDC, `az acr build`, pinned image digest deploy, revision health wait, traffic shift, `/api/health` verification, and deployment evidence upload.
- `.github/workflows/post-deploy-crawl.yml`: production crawl now triggers from successful `ACA main deploy` completion instead of every `main` push.

## QA / Validation

- `ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f); puts "OK #{f}" }' .github/workflows/aca-main-deploy.yml .github/workflows/post-deploy-crawl.yml` — pass.
- `npx prettier --check .github/workflows/aca-main-deploy.yml .github/workflows/post-deploy-crawl.yml docs/releases/records/2026-06-16-aca-main-deploy-workflow.md` — pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live ACA deploy execution — not run in this PR branch; runs only after merge to `main` with the GitHub `production` environment and Azure OIDC variables available.

## Rollout Plan

Merge to `main`. The next `main` push triggers `ACA main deploy`, subject to the GitHub `production` environment and required Azure OIDC variables. After the deploy workflow succeeds, `Post-deploy crawl` runs against `https://app.abarva.ai`.

Required GitHub variables or secrets:

- `AZURE_CLIENT_ID` or existing secret `AZURE_LAB_CLIENT_ID`
- `AZURE_TENANT_ID` or existing secret `AZURE_LAB_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID` or existing secret `AZURE_LAB_SUBSCRIPTION_ID`; defaults to the existing lab subscription id used by the other Azure workflows.

Optional override variables:

- `AZURE_ACR_NAME` defaults to `acrabarvalab001`.
- `AZURE_WEB_IMAGE_REPOSITORY` defaults to `abarva/web`.
- `AZURE_WEB_CONTAINER_APP_NAME` defaults to `ca-abarva-web-lab-eastus`.
- `AZURE_WEB_RESOURCE_GROUP` defaults to `rg-abarva-controlplane-lab-eastus`.
- `PRODUCTION_URL` defaults to `https://app.abarva.ai`.

## Rollback Plan

Use the uploaded `traffic-before.json` artifact from the deploy run to identify the prior healthy revision, then shift 100% traffic back with `az containerapp ingress traffic set`. No schema or data migration is included.

## Audit Evidence

- PR URLs: https://github.com/abarva-platform/abarva/pull/3536 and https://github.com/abarva-platform/abarva/pull/3537
- CI run: pending.
- Deploy artifact after first run: `aca-main-deploy`, containing `image.txt`, `traffic-before.json`, `containerapp-update.json`, `revision.json`, `traffic-after.json`, and `health.json`.

## Known Gaps

This PR wires the deployment path. The first run on `main` showed that the deploy workflow must use the repository's existing `AZURE_LAB_CLIENT_ID` / `AZURE_LAB_TENANT_ID` OIDC secrets rather than unset generic variables; the workflow now supports both names and fails early with an explicit preflight message if neither is present.
