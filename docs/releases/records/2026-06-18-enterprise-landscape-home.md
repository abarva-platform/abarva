# 2026-06-18-enterprise-landscape-home - Enterprise Landscape Home

## Release ID

`2026-06-18-enterprise-landscape-home`

## Status

`candidate`

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
- Browser smoke and deployment verification still required before marking released.

## Rollout Plan

Merge to the active release branch, build a new app image, deploy to Azure Container Apps, then browser-smoke `/admin` as a signed-in SkyHarbor or switched SkyHarbor session.

## Rollback Plan

Revert the import and early overview return in `src/app/(maestro)/admin/page.tsx` to restore the prior HomeOverviewV2 setup/trust overview. No schema or data rollback is required.

## Audit Evidence

- Focused ESLint output.
- TypeScript output.
- Browser screenshot/crawl after deployment.
- Git commit and deployed ACA revision/tag once released.

## Context Ingestion Evidence

Not applicable. This release does not load, parse, stage, commit, embed, or refresh client context/corpus data.

## Known Gaps

- SkyHarbor is the only richly authored client in this first candidate.
- Other clients use the same dynamic template with generic section bodies until their derived enterprise reads are bound.
- Source trail currently displays source titles and descriptions from the view model; live row/page/sheet citation binding remains a follow-up.
