# 2026-06-16-tower-hard-retire-legacy-routes — Hard-Retire Legacy Tower Routes

## Release ID

`2026-06-16-tower-hard-retire-legacy-routes`

## Status

`candidate`

## Plain-English Summary

This release removes the older Tower subpages and emergency legacy Tower fallback so `/tower` is the single AI Control Tower experience. Product links that previously sent users to retired Tower portfolio, onboarding, pressure, program, DAG, or value pages now land on the new `/tower` surface.

## Layer Impact

- `global-control-lane`: Shared Tower routing, navigation shortcuts, crawl inventory, and post-sign-in routing change for all clients.
- `public-demo`: Demo navigation is simplified so the Republic Bank / CXO demo cannot accidentally open older Tower views.

## Client Applicability

- All clients: Yes. Applies to shared Tower routing for Apex, First Capital, SkyHarbor, Meridian, Lakeshore, and future clients.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. The legacy Tower fallback is removed.

## Changes Included

- Removes legacy `/tower/*` subroute page files for activity, lens, onboarding, outcomes, portfolio, portfolio DAG, pressures, preview, programs, projects, source portfolio value, staff augmentation, tech stack, and volumetrics.
- Removes the `TOWER_LEGACY_VIEW_ENABLED` fallback from `src/app/(maestro)/tower/page.tsx`.
- Updates command palette, post-sign-in routing, crawl route catalog, home fixture links, portfolio/value links, and template copy to target `/tower`.

## QA / Validation

- PASS: `git diff --check`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npx eslint 'src/app/(maestro)/tower/page.tsx' 'src/components/shell/CommandPalette.tsx' 'src/components/_shared/InstanceSummaryTile.tsx' 'src/components/tower/ProgramScopePage.tsx' 'src/lib/auth/access-routing.ts' 'src/lib/crawl/persona-switcher.ts' 'src/lib/home/shell-home-fixture.ts' 'src/lib/integrity/route-catalog.ts' 'src/lib/programs/cross-module-trace-view.ts' 'src/lib/reasoning/portfolio-alerts.ts' 'src/lib/tower/ingest/erp/template-builder.ts' 'src/lib/tower/value-states/repository.ts' 'src/scripts/templates/generate-csv.ts' 'src/scripts/templates/generate-xlsx.ts' 'src/__tests__/integration/demo-p0-graceful-degradation.test.ts'`
- PASS: `npm run test:integration -- --runTestsByPath src/__tests__/integration/demo-p0-graceful-degradation.test.ts`
- PASS: `npx jest src/lib/reasoning/__tests__/portfolio-alerts.test.ts --silent`
- PASS: `npm run build`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN: Authenticated signed-in browser verification, because the local browser session does not have a Clerk session.

## Rollout Plan

Merge to `main`. The ACA main deploy workflow builds a new Azure Container Apps image, creates a new revision, waits for health, and shifts 100% traffic after the health check passes.

## Rollback Plan

Revert the PR to restore the prior redirect-shell route files and legacy fallback. No data rollback is required.

## Audit Evidence

- PR: pending.
- CI: pending.
- Local build route manifest: only `/tower` remains under the Tower app route.
- ACA deploy: pending.

## Known Gaps

Authenticated visual verification still requires a signed-in Clerk session. Unauthenticated route checks can prove auth redirect and health, but not the signed-in CXO canvas.
