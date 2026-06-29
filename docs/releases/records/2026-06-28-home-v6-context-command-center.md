# 2026-06-28-home-v6-context-command-center — Home V6 Context Command Center

## Release ID

`2026-06-28-home-v6-context-command-center`

## Status

`candidate`

## Plain-English Summary

Home now behaves as the tenant context command center instead of a generic current-state report. The page shows the V6 context pack status, loaded business records, metadata-field coverage, populated/data-thin posture, known context, missing evidence, answer boundaries, readiness by business area, and top data-thin signals before users move to Intelligence, Tower, Moves, or Source.

## Layer Impact

- `global-control-lane`: Updates the shared Home UI/UX for all clients with a generated V6 context pack.
- `client-data-lane`: Reads generated V6 manifest and metadata dictionary artifacts from tenant dataset packs to render context readiness. No production database mutation is included.

## Client Applicability

- All clients: Applies to tenants with generated V6 packs.
- Specific clients: Apex Retail, First Capital, Lakeshore, Meridian, and SkyHarbor have generated V6 pack coverage in the local artifact set.
- Internal only: Not applicable.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/lib/home/enterprise-landscape-view-model.ts`
- `src/lib/context-packs/v4-manifest.ts`
- `src/components/home/EnterpriseLandscapeHome.tsx`
- `src/components/home/EnterpriseLandscapeHome.module.css`
- `src/components/home/HomeSurface.tsx` sunset marker only
- `src/components/home/__tests__/EnterpriseLandscapeHome.agent-dock.test.tsx`
- `src/lib/home/__tests__/enterprise-landscape-v6-command-center.test.ts`
- `src/app/(maestro)/home/__tests__/home-v6-frontend-sunset.test.ts`
- `datasets/*-synthetic-v6` generated V6 tenant packs for Apex, First Capital, Lakeshore, Meridian, and SkyHarbor
- `datasets/enterprise-intelligence-template-pack-v6`

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/lib/home/__tests__/enterprise-landscape-v6-command-center.test.ts src/components/home/__tests__/EnterpriseLandscapeHome.agent-dock.test.tsx --runInBand` passed: 2 suites, 6 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-v6-frontend-sunset.test.ts' --runInBand` passed: 1 suite, 1 test.
- `npx eslint 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/home/__tests__/home-v6-frontend-sunset.test.ts' src/components/home/HomeSurface.tsx src/components/home/EnterpriseLandscapeHome.tsx src/lib/home/enterprise-landscape-view-model.ts src/lib/context-packs/v4-manifest.ts src/lib/home/__tests__/enterprise-landscape-v6-command-center.test.ts src/components/home/__tests__/EnterpriseLandscapeHome.agent-dock.test.tsx` passed.
- Pre-deploy production signed-in crawl on the old deployed Home passed for Lakeshore and SkyHarbor and proved current auth/tenant routing plus one visible aVa answer per tenant. New V6 UI proof is pending post-deploy.

## Deployment Authority

- Runtime lane: Azure Container Apps only.
- Approved target: `ca-abarva-web-lab-eastus` in `rg-abarva-controlplane-lab-eastus`.
- Container registry: `acrabarvalab001.azurecr.io/abarva/web`.
- Deployment command family: `az acr build` followed by `az containerapp update` and 100% ACA ingress traffic assignment.
- Explicitly not authorized: Vercel deploys, Vercel production aliases, Vercel rollbacks, or `*.vercel.app` URLs as production evidence.

## Rollout Plan

Deploy through Azure Container Apps. After deployment, run signed-in browser checks for Lakeshore and SkyHarbor to confirm the Home page renders the V6 command center and that the aVa panel still opens with the shared dock. Run First Capital/First Financial as an additional alias check when auth state is available.

## Rollback Plan

Rollback the ACA image to the previous release. No database rollback is required because this change reads generated V6 artifacts and changes UI/tests only.

## Audit Evidence

- V6 pack reconciliation test: `src/lib/home/__tests__/enterprise-landscape-v6-command-center.test.ts`
- Home UI test: `src/components/home/__tests__/EnterpriseLandscapeHome.agent-dock.test.tsx`
- Old frontend sunset guard: `src/app/(maestro)/home/__tests__/home-v6-frontend-sunset.test.ts`

## Context Ingestion Evidence

This release does not ingest or mutate client context. It reads generated local V6 pack artifacts for Home readiness display.

- Local artifact generated: Not applicable in this release.
- Local parse/preflight: V6 manifests and business metadata dictionaries reconciled in Jest.
- Product loader/API acceptance: Not applicable.
- Azure Blob/object storage staging: Not applicable.
- Queue/private worker handoff: Not applicable.
- Parser extraction with source citations: Not applicable.
- Review/approval queue: Not applicable.
- Client data-plane commit: Not applicable.
- Embedding/search refresh: Not applicable.
- Live signed-in retrieval or answer QA: Pending post-deploy signed-in browser proof.

## Known Gaps

- Browser-visible signed-in proof is pending because localhost auth redirected to `/access`.
- Home aVa live testing should be run after ACA deployment. This release keeps the existing Home Ask backend engine in place and adapts the new frontend to its response shape.
