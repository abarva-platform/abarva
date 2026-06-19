# 2026-06-18-enterprise-landscape-home - Enterprise Landscape Home

## Release ID

`2026-06-18-enterprise-landscape-home`

## Status

`deployed-lab-corrected`

## Plain-English Summary

The signed-in `/home` surface now opens as an Enterprise Landscape current-state assessment. `/admin` remains the setup/admin control plane. `/intelligence` now opens as an advisory-board surface instead of the older repository/explorer framing. Home uses the consulting-report layout with the same left assessment menu, a center report canvas, section-specific tables/charts/diagrams, a right leadership panel, and a source-trail drawer.

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

## Rollout Plan

Built and deployed corrected image to Azure Container Apps lab. Verify `/home` and `/admin` behind a signed-in session before promoting beyond lab/demo use.

## Rollback Plan

Rollback by shifting ACA traffic to the previous known-good revision `ca-abarva-web-lab-eastus--m6ece1b74`, then revert the `/home`, `/intelligence`, nav, and proxy route changes. No schema or data rollback is required.

## Audit Evidence

- Focused ESLint output.
- TypeScript output.
- Git commit `893cb1539` was the incorrect `/admin` candidate.
- Live traffic was rolled back to `ca-abarva-web-lab-eastus--m6ece1b74`.
- Corrected git commit `bad4a1c82`.
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
- Signed-in visual QA is pending because the browser session used for deployment verification was not authenticated.
- ACA logs still show pre-existing tenant-id/notification warnings during unrelated background embedding/audit paths; this release did not change those paths.
