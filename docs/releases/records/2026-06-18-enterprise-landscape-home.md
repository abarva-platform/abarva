# 2026-06-18-enterprise-landscape-home - Enterprise Landscape Home

## Release ID

`2026-06-18-enterprise-landscape-home`

## Status

`deployed-lab`

## Plain-English Summary

The signed-in Home surface now opens as an Enterprise Landscape current-state assessment instead of the prior setup/trust overview. The page uses a consulting-report layout with the same left assessment menu, a center report canvas, section-specific tables/charts/diagrams, a right leadership panel, and a source-trail drawer.

## Layer Impact

- `global-control-lane`: changes the default Home overview experience for signed-in users because the top-nav Home route still lands on `/admin`.
- `client-data-lane`: no data is mutated. The first implementation reads a client-aware view model and uses SkyHarbor-specific derived assessment content with generic fallbacks for other clients.

## Client Applicability

- All clients: receive the Enterprise Landscape Home shell and exact assessment-section navigation.
- Specific clients: SkyHarbor receives the richest current-state content in this candidate.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none in this candidate.

## Changes Included

- `src/app/(maestro)/admin/page.tsx`
- `src/components/home/EnterpriseLandscapeHome.tsx`
- `src/components/home/EnterpriseLandscapeHome.module.css`
- `src/lib/home/enterprise-landscape-view-model.ts`
- `docs/build/intelligence/ENTERPRISE_LANDSCAPE_DYNAMIC_TEMPLATE_CONTRACT_2026-06-18.md`

## QA / Validation

- `npx eslint src/components/home/EnterpriseLandscapeHome.tsx src/lib/home/enterprise-landscape-view-model.ts 'src/app/(maestro)/admin/page.tsx'` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed locally before image build.
- ACR build `caf7` passed for image `acrabarvalab001.azurecr.io/abarva/web:enterprise-landscape-home-893cb1539`.
- Image digest: `sha256:30629302c827a0ac1b4f17ab5007ab725376682a4891885d7ddf44edaeb41bea`.
- Azure Container Apps revision `ca-abarva-web-lab-eastus--0000110` is `Healthy` / `Running`.
- `https://app.abarva.ai/api/health` returned `ok: true` with Postgres and Azure graph checks true.
- `/admin` browser smoke without a Clerk session correctly redirected to `/sign-in?redirect=%2Fadmin`; signed-in visual QA is still pending.

## Rollout Plan

Built and deployed to Azure Container Apps lab. Traffic is 100% on revision `ca-abarva-web-lab-eastus--0000110`. Browser-smoke `/admin` as a signed-in SkyHarbor or switched SkyHarbor session before promoting beyond lab/demo use.

## Rollback Plan

Revert the import and early overview return in `src/app/(maestro)/admin/page.tsx` to restore the prior HomeOverviewV2 setup/trust overview. No schema or data rollback is required.

## Audit Evidence

- Focused ESLint output.
- TypeScript output.
- Git commit `893cb1539`.
- ACR image `acrabarvalab001.azurecr.io/abarva/web:enterprise-landscape-home-893cb1539`.
- ACR digest `sha256:30629302c827a0ac1b4f17ab5007ab725376682a4891885d7ddf44edaeb41bea`.
- ACA revision `ca-abarva-web-lab-eastus--0000110` with 100% traffic.
- Public health response from `https://app.abarva.ai/api/health`.
- Browser redirect check for protected `/admin` route.

## Context Ingestion Evidence

Not applicable. This release does not load, parse, stage, commit, embed, or refresh client context/corpus data.

## Known Gaps

- SkyHarbor is the only richly authored client in this first candidate.
- Other clients use the same dynamic template with generic section bodies until their derived enterprise reads are bound.
- Source trail currently displays source titles and descriptions from the view model; live row/page/sheet citation binding remains a follow-up.
- Signed-in visual QA is pending because the browser session used for deployment verification was not authenticated.
