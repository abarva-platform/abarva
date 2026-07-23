# 2026-07-23-home-enterprise-brief-app — Home Enterprise Brief Replacement

## Release ID

`2026-07-23-home-enterprise-brief-app`

## Status

`candidate — brand-new replacement pending PR, deploy, and signed-in proof`

## Plain-English Summary

Replaces the transitional Home cockpit with a brand-new Enterprise Brief app modeled on the supplied `Home Enterprise Brief (offline).html` reference. This is not an incremental patch to the old page. The Home route now renders a clean executive briefing surface with a simple Mac/Finder-style context explorer, page-style executive sections, Recharts visuals, a business-readable relationship graph, evidence inventory, and dimension drilldowns.

This release also sunsets the old Home rendering surfaces from the active route. The legacy tabbed surface and React Flow relationship test are removed so the product cannot drift back to the older page.

## Layer Impact

- `global-control-lane`: changes the shared Home route and client-visible Home UX for approved knowledge packs.
- Home read model: continues to read approved Home packs from the existing Postgres-first loader with JSON fallback.
- Client-visible rendering: replaces the old cockpit component with `HomeEnterpriseBriefApp`.
- Visual layer: uses Recharts for dashboard charts and a governed SVG relationship map for the Enterprise Brief graph.
- Data layer: no schema migration and no data mutation in this PR.

## Client Applicability

- All clients: active tenants with an approved Home knowledge pack.
- Specific proof target: Meridian Health System and FS Demo / Arcturus.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeEnterpriseBriefApp.tsx`
- `src/components/home/HomeExecutiveCockpit.tsx` removed
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx` removed
- `src/components/home/__tests__/buildRelationshipTopology.test.ts` removed
- `package.json` / `package-lock.json`: removed old React Flow / Dagre graph dependencies no longer used by Home.
- Home route and integration tests updated to require the new component and reject old Home surfaces.

## QA / Validation

- Focused ESLint — pass locally.
- Focused Home Jest tests — pass locally with existing duplicate manual mock warnings.
- `git diff --check` — pass locally.
- Full TypeScript — pass locally.
- `npm run release:check` — pass locally.
- Production build — pass locally with existing broad dynamic file-pattern warnings.
- Signed-in browser proof for Meridian and FS Demo / Arcturus after ACA deploy — not-run until deploy.

Prior related evidence:

- PR #5429 replaced the first legacy Home route and deployed to ACA revision `ca-abarva-web-lab-eastus--m5c1b1775` with digest `sha256:314f58a1e1ac40a7075439a0df15c2b7b5b6c71396eec16ca519760e1bacc514`.
- PR #5433 was merged but its ACA deploy was cancelled after product direction changed to a brand-new reference app.

## Rollout Plan

Open this PR against `main`, merge through the repository lane, deploy through the repo-owned Azure Container Apps main workflow, verify the ACA runtime invariant, then run signed-in browser proof for Meridian and FS Demo / Arcturus.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior known-good ACA image through the repo-owned deploy workflow. No schema migration is included.

## Audit Evidence

- Previous PR URL: https://github.com/abarva-platform/abarva/pull/5429
- Cancelled interim PR URL: https://github.com/abarva-platform/abarva/pull/5433
- Current PR URL: pending.
- Current CI run: pending.
- Current ACA revision and image digest: pending.
- Current signed-in screenshots and DOM proof: pending.

## Known Gaps

- Browser proof must confirm the new Enterprise Brief app is visible for Meridian and FS Demo / Arcturus, the left explorer is simple and elegant, the relationship view renders as a graph, the old duplicate tabs are gone, and raw source mechanics are not visible in the CXO surface.
