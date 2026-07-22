# 2026-07-22-tower-safe-recharts-mount — Tower Safe Recharts Mount

## Release ID

`2026-07-22-tower-safe-recharts-mount`

## Status

`candidate`

## Plain-English Summary

Tower charts now wait for a real, positive-size layout container before mounting Recharts. This prevents browser-visible Recharts sizing warnings when Tower tabs, hidden panels, or fallback surfaces initialize before layout is complete.

## Layer Impact

- Lane: `global-control-lane`
- Presentation layer: adds a Tower-only safe responsive chart wrapper for the command-center charts and legacy CXO chart helpers.
- Data layer: no change. Tower mart values, facts, evidence, and lineages are unchanged.
- Runtime behavior: no module behavior or prompt behavior changes; this only prevents zero-size chart mounts.

## Client Applicability

- All clients: Tower chart rendering safety applies wherever Tower Recharts views render.
- Specific clients: Meridian/Healthcare Demo is the signed-in proof target because it currently exercises the CXO Tower command center.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/components/tower/charts/TowerCxoCharts.tsx`

## QA / Validation

- `npm test -- src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed, 24/24 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/charts/TowerCxoCharts.tsx` passed with pre-existing Tower unused-symbol warnings and no errors.
- `git diff --check` passed.
- `npm run release:check` must pass before merge.
- Signed-in ACA browser proof is required after deploy to confirm no Recharts sizing warnings remain.

## Rollout Plan

Merge by PR into `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. After deploy, verify the ACA runtime invariant, then run signed-in Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: captured after ACA deploy
- ACA runtime invariant: required after deploy
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: yes, `/tower` for Meridian/Healthcare Demo

## Rollback Plan

Revert this PR and redeploy through the approved ACA lane. Since there are no schema, prompt, or data changes, rollback is presentation-only.

## Audit Evidence

- PR URL to be added after opening.
- Post-deploy ACA invariant output.
- Post-deploy signed-in Tower browser proof screenshots and console log.

## Known Gaps

- This does not change Tower data, chart design, chart selection, or live telemetry ingestion. It only removes zero-size chart mount warnings.
