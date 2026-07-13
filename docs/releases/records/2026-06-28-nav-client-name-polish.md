# 2026-06-28-nav-client-name-polish — Nav Client Name Polish

## Release ID

`2026-06-28-nav-client-name-polish`

## Status

`candidate`

## Plain-English Summary

Polishes the active client name in the black product toolbar. The client name remains beside the AbarVa logo, but now uses a brighter, non-italic sans treatment so it reads as a clean workspace label instead of a loose editorial note.

## Layer Impact

- `global-control-lane`: shared product chrome used across signed-in client surfaces. This is visual-only toolbar polish and does not change routing, data access, auth, tenant resolution, or page content.

## Client Applicability

- All clients: yes, applies to the shared signed-in top navigation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/shell/AppTopBar.tsx`: restyles the active client label beside the AbarVa logo with a brighter white sans treatment and a slightly taller divider.

## QA / Validation

- PASS: `npx eslint src/components/shell/AppTopBar.tsx`
- PASS: `npm run release:check`

## Rollout Plan

Deploy through Azure Container Apps for `app.abarva.ai` using `docs/runbooks/azure-container-apps-deploy.md`. Build the image from the exact release commit SHA, update `ca-abarva-web-lab-eastus`, wait for the new revision to become healthy, then assign 100% ingress traffic to that revision.

## Deployment Authority

- Repo-owned deploy path: Azure Container Apps, using `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: `az acr build`, `az containerapp update`, and `az containerapp ingress traffic set` for `ca-abarva-web-lab-eastus`.
- Approved image digest: To be recorded after ACR build/deploy.
- ACA runtime invariant: `app.abarva.ai` must route 100% traffic to the new healthy revision before the release is called deployed.
- Worker image invariant: Not affected. This release changes only shared web chrome.
- Feature/env flag update path: No feature or environment flag changes.
- Live signed-in proof required: Yes. The nav toolbar is a signed-in product surface, so browser-visible proof is required after the ACA traffic shift.

## Rollback Plan

Rollback by moving Azure Container Apps ingress traffic back to the previous healthy revision. No database, data-plane, or feature-flag rollback is required.

## Audit Evidence

- Release commit SHA.
- Azure Container Apps revision and image tag after deployment.
- Browser-visible screenshot/proof of the top nav on `https://app.abarva.ai`.

## Context Ingestion Evidence

Not applicable. This release does not touch ingestion, loaders, document parsing, embeddings, search, tenant corpus loading, or retrieval.

## Known Gaps

This release does not change tenant resolution, product navigation, auth, logo assets, page routing, agent windows, or any data-loading behavior. Post-deploy proof must still be captured in a signed-in browser because curl health checks alone cannot prove the toolbar treatment is visible to users.
