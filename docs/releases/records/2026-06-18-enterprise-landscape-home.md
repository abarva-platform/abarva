# 2026-06-18-enterprise-landscape-home - Enterprise Landscape Home

## Release ID

`2026-06-18-enterprise-landscape-home`

## Status

`deployed-lab-v3`

## Plain-English Summary

The signed-in `/home` surface now opens as an Enterprise Landscape current-state assessment. `/admin` remains the setup/admin control plane. `/intelligence` now opens as an advisory-board surface instead of the older repository/explorer framing. `/tower` removes the old L0/L1/L2/L3 lens labels and opens as a portfolio command center with leadership-oriented spend, value, adoption, risk, evidence, and action language.

The retired Context/Corpus Explorer implementation that produced the poor screenshots has been removed from runtime source, and tenant-specific `/tenant/[tenantSlug]/intelligence` deep links now redirect to canonical `/intelligence?client=...` so the old lens-tab page cannot appear through an alternate path.

## Layer Impact

- `global-control-lane`: separates client-facing Home from Setup/Admin. Top-nav Home lands on `/home`; `/admin` remains setup/admin.
- `client-data-lane`: no data is mutated. The first implementation reads a client-aware view model and uses SkyHarbor-specific derived assessment content with generic fallbacks for other clients.

## Client Applicability

- All clients: receive the Enterprise Landscape Home shell and exact assessment-section navigation.
- Specific clients: SkyHarbor receives the richest current-state content in this candidate.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this candidate.

## Changes Included

- `src/app/(maestro)/admin/page.tsx`
- `src/app/(maestro)/home/page.tsx`
- `src/app/(maestro)/intelligence/page.tsx`
- `src/components/home/EnterpriseLandscapeHome.tsx`
- `src/components/home/EnterpriseLandscapeHome.module.css`
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.module.css`
- `src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx`
- `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx` deleted
- `src/components/tower/AiControlTowerPage.tsx`
- `src/components/tower/__tests__/AiControlTowerPage.test.tsx`
- `src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts`
- `src/lib/home/enterprise-landscape-view-model.ts`
- `src/proxy.ts`
- `src/components/shell/topbar-nav-items.ts`
- `src/lib/home/top-nav-items.ts`
- `docs/build/intelligence/ENTERPRISE_LANDSCAPE_DYNAMIC_TEMPLATE_CONTRACT_2026-06-18.md`

## QA / Validation

- `npx eslint src/components/home/EnterpriseLandscapeHome.tsx src/lib/home/enterprise-landscape-view-model.ts 'src/app/(maestro)/admin/page.tsx'` passed.
- `npx eslint 'src/app/(maestro)/admin/page.tsx' 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/intelligence/page.tsx' src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/proxy.ts src/components/shell/topbar-nav-items.ts src/lib/home/top-nav-items.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed locally before image build.
- Prior incorrect lab deploy routed Home through `/admin`; live traffic was rolled back to revision `ca-abarva-web-lab-eastus--m6ece1b74` before this corrected candidate.
- ACR build `cafa` passed for image `acrabarvalab001.azurecr.io/abarva/web:home-intelligence-routes-bad4a1c82`.
- Image digest: `sha256:49cf49da21ad2e608bd2d84318442c5148443222a82e9ae04e53d10fd8504212`.
- Azure Container Apps revision `ca-abarva-web-lab-eastus--0000111` is `Healthy` / `Running`.
- Traffic is 100% on revision `ca-abarva-web-lab-eastus--0000111`.
- `https://app.abarva.ai/api/health` returned `ok: true` with Postgres and Azure graph checks true.
- Unauthenticated route smoke: `/home` redirects to `/sign-in?redirect=%2Fhome`, `/admin` redirects to `/sign-in?redirect=%2Fadmin`, and `/intelligence` returns 200 because the middleware currently treats `/intelligence` as public.
- Deployed `/intelligence` HTML contains `AbarVa Intelligence`, `Advisory board`, and `Recommendation`.
- Follow-up correction on 2026-06-19: live traffic was observed on revision `ca-abarva-web-lab-eastus--m25a59674` while latest ready revision was `ca-abarva-web-lab-eastus--0000111`; this made the older pages visible again.
- `npx eslint src/components/tower/AiControlTowerPage.tsx src/components/tower/__tests__/AiControlTowerPage.test.tsx 'src/app/(maestro)/home/layout.tsx' 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/intelligence/page.tsx' 'src/app/(maestro)/tower/page.tsx'` passed.
- `npx jest src/components/tower/__tests__/AiControlTowerPage.test.tsx --runInBand` passed after pinning the new command-center labels and offline Atlas fallback.
- `npx jest src/components/shell/__tests__/topbar-nav-home-admin.test.ts --runInBand` passed, preserving `/home` and `/admin` separation.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npm run release:check` passed.
- ACR build `cafg` passed for image `acrabarvalab001.azurecr.io/abarva/web:intelligence-retired-explorer-09311f955`.
- Image digest: `sha256:01e0559f2a4614708dfdb9d44105e4551b4fd60cf2e1909a93034fc49fc9996c`.
- Azure Container Apps revision `ca-abarva-web-lab-eastus--0000114` is `Healthy` / `Running`.
- Traffic is 100% on revision `ca-abarva-web-lab-eastus--0000114`.
- `https://app.abarva.ai/api/health` returned `ok: true` with Postgres and Azure graph checks true.
- Live unauthenticated route smoke: `/home`, `/admin`, and `/tower` redirect to sign-in; `/intelligence` returns 200.
- Live `/intelligence` HTML contains `AbarVa Intelligence`, `Advisory board`, and `Recommendation`.
- Live `/intelligence` HTML does not contain the retired bad-page strings: `What your context is telling us`, `The strongest cross-context reads`, `Dimensions Loaded`, `Graph Edges`, `Ask about loaded context`, or `ContextCorpusExplorerPage`.
- Signed-in Chrome crawl found the old Intelligence tab title/body until cache-busted navigation; after cache-bust, `/intelligence` rendered `Intelligence · Advisory Board | AbarVa` and no retired Explorer copy.
- Signed-in Chrome crawl found `/home` rendering First Capital chrome with a hardcoded `TENANT - SKYHARBOR AIR` meta value inside the generic assessment. Fixed generic Home sections to derive the `TENANT` meta value from the active tenant name.
- 2026-06-19 cleanup: `src/components/intelligence-v4/ContextCorpusExplorerPage.tsx` deleted.
- 2026-06-19 cleanup: `/tenant/[tenantSlug]/intelligence` now redirects to `/intelligence?client=<tenantKey>` instead of rendering `IntelligenceLensTabs`.
- 2026-06-19 cleanup: runtime source scan across Home, Intelligence, Tower, tenant routes, and active Home/Intelligence/Tower components found no matches for the bad-page strings: `What your context is telling us`, `The strongest cross-context reads`, `Dimensions Loaded`, `Graph Edges`, `Ask about loaded context`, `ACTIVE CANVAS`, `AI CONTROL TOWER`, or `ContextCorpusExplorerPage`.
- `npx eslint 'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx' src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts 'src/app/(maestro)/home/page.tsx' 'src/app/(maestro)/intelligence/page.tsx' 'src/app/(maestro)/tower/page.tsx'` passed.
- `npx jest src/__tests__/integration/intelligence/context-corpus-explorer-route.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- `npm run release:check` passed.
- 2026-06-19 Home tenant-meta fix: `npx eslint src/lib/home/enterprise-landscape-view-model.ts src/components/home/EnterpriseLandscapeHome.tsx 'src/app/(maestro)/home/page.tsx'` passed.
- 2026-06-19 Home tenant-meta fix: `npx tsc --noEmit --pretty false` passed.
- 2026-06-19 Home tenant-meta fix: `npm run build` passed.
- 2026-06-19 Home tenant-meta fix: `npm run release:check` passed.
- ACR build `cafn` passed for image `acrabarvalab001.azurecr.io/abarva/web:home-tenant-meta-8e4da3706`.
- Image digest: `sha256:48cca57f350a513ba90b9905c20ce3b2997f27e1af06c657917b1d41ea86d344`.
- Azure Container Apps revision `ca-abarva-web-lab-eastus--0000115` is `Healthy` / `Running`.
- Traffic is 100% on revision `ca-abarva-web-lab-eastus--0000115`.
- Signed-in Chrome crawl after cache-busted navigation: `/home` rendered `Home · Enterprise Landscape | AbarVa`, showed First Capital tenant meta, and did not show SkyHarbor tenant meta.
- Signed-in Chrome crawl after cache-busted navigation: `/intelligence` rendered `Intelligence · Advisory Board | AbarVa` and did not show retired Explorer copy.
- Signed-in Chrome crawl after cache-busted navigation: `/tower` rendered `AI Control Tower · AbarVa` and did not show retired Explorer copy.
- Signed-in Chrome crawl after cache-busted navigation: `/admin` rendered `Setup · AbarVa`, preserving the setup/admin module.

## Rollout Plan

Deployed to Azure Container Apps lab on revision `ca-abarva-web-lab-eastus--0000115` with 100% traffic. Signed-in Chrome crawl has verified `/home`, `/intelligence`, `/tower`, and `/admin` after cache-busted navigation.


## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — this change merged to main; ACA main deploy
  workflow builds and deploys from `refs/heads/main` only.
- ACA runtime invariant: new revision healthy before 100% traffic.
- Live signed-in client proof required: yes — verified on `app.abarva.ai` post-merge.

## Rollback Plan

Rollback by shifting ACA traffic to the previous known-good revision `ca-abarva-web-lab-eastus--m6ece1b74`, then revert the `/home`, `/intelligence`, nav, and proxy route changes. No schema or data rollback is required.

For the v3 cleanup specifically, rollback by shifting ACA traffic off `ca-abarva-web-lab-eastus--0000114` to the previous healthy revision, then reverting commit `09311f955`. No schema or data rollback is required.

For the Home tenant-meta correction specifically, rollback by shifting ACA traffic off `ca-abarva-web-lab-eastus--0000115` to revision `ca-abarva-web-lab-eastus--0000114`, then reverting commit `8e4da3706`. No schema or data rollback is required.

## Audit Evidence

- Focused ESLint output.
- TypeScript output.
- Git commit `893cb1539` was the incorrect `/admin` candidate.
- Live traffic was rolled back to `ca-abarva-web-lab-eastus--m6ece1b74`.
- Corrected git commit `bad4a1c82`.
- Cleanup commit `09311f955` removes the retired v4 Explorer from runtime source and prevents tenant deep-link leakage.
- ACR image `acrabarvalab001.azurecr.io/abarva/web:intelligence-retired-explorer-09311f955`.
- ACR digest `sha256:01e0559f2a4614708dfdb9d44105e4551b4fd60cf2e1909a93034fc49fc9996c`.
- ACA revision `ca-abarva-web-lab-eastus--0000114` with 100% traffic.
- Live marker check for required Advisory Board copy and forbidden retired Explorer copy.
- Home tenant-meta correction commit `8e4da3706`.
- ACR image `acrabarvalab001.azurecr.io/abarva/web:home-tenant-meta-8e4da3706`.
- ACR digest `sha256:48cca57f350a513ba90b9905c20ce3b2997f27e1af06c657917b1d41ea86d344`.
- ACA revision `ca-abarva-web-lab-eastus--0000115` with 100% traffic.
- Signed-in Chrome route crawl for `/home`, `/intelligence`, `/tower`, and `/admin` after cache-busted navigation.
- ACR image `acrabarvalab001.azurecr.io/abarva/web:home-intelligence-routes-bad4a1c82`.
- ACR digest `sha256:49cf49da21ad2e608bd2d84318442c5148443222a82e9ae04e53d10fd8504212`.
- ACA revision `ca-abarva-web-lab-eastus--0000111` with 100% traffic.
- Public health response from `https://app.abarva.ai/api/health`.
- Route smoke headers for `/home`, `/admin`, and `/intelligence`.
- HTML marker check for the deployed advisory Intelligence surface.

## Context Ingestion Evidence

Not applicable. This release does not load, parse, stage, commit, embed, or refresh client context/corpus data.

## Known Gaps

- SkyHarbor is the only richly authored client in this first candidate.
- Other clients use the same dynamic template with generic section bodies until their derived enterprise reads are bound.
- Source trail currently displays source titles and descriptions from the view model; live row/page/sheet citation binding remains a follow-up.
- Signed-in visual QA is pending until traffic is moved to the v2 corrected image and the authenticated browser session is refreshed.
- ACA logs still show pre-existing tenant-id/notification warnings during unrelated background embedding/audit paths; this release did not change those paths.
