# 2026-07-16-postdeploy-legacy-language-hotfix — Post-Deploy Legacy Language Hotfix

## Release ID

`2026-07-16-postdeploy-legacy-language-hotfix`

## Status

`candidate`

## Plain-English Summary

Removes default Home candidate-preview wording and user-facing Intelligence V6 corpus labels that were found during the post-deploy signed-in smoke after the legacy dataset sunset release. This does not load data, promote candidate artifacts, or change tenant access.

## Layer Impact

- `global-control-lane`: Updates shared Home and Intelligence presentation copy for all tenants.
- `public-demo`: Improves demo-facing language so internal build-lineage labels do not appear in executive UI.

## Client Applicability

- All clients: Yes, for shared Home/Knowledge and Intelligence surfaces.
- Specific clients: Meridian, SkyHarbor Air, and First Capital were used as proof tenants.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Home active-mode status copy now says active/inactive-preview language without showing `Candidate preview` unless preview mode is explicitly requested.
- Intelligence advisory corpus labels now use business-facing `industry corpus` language instead of V6 labels.
- Intelligence readiness helper copy avoids V6 wording in visible packet text and error text.

## QA / Validation

- `npx jest src/lib/home/__tests__/home-data-quality.test.ts src/components/home/__tests__/HomeSurface.test.tsx --runInBand` — Pass.
- `npx eslint src/components/home/HomeSurface.tsx src/lib/home/home-data-quality.ts src/lib/home/home-summary-snapshot.ts src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/lib/intelligence/skyharbor-cto-readiness.ts src/lib/intelligence/industrial-cio-backoffice-readiness.ts` — Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — Pass.
- `git diff --check` — Pass.
- Pre-hotfix live smoke on deployed commit `5914f8ee` found no auth/runtime/cross-tenant failures, but did detect default Home candidate-preview wording and Intelligence V6 wording.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting main commit. No manual Azure mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home and Intelligence for Meridian, SkyHarbor Air, and First Capital.

## Rollback Plan

Revert the hotfix PR and let the repo-owned ACA main deploy workflow redeploy the prior main image. No database rollback is required.

## Audit Evidence

- Hotfix PR and CI checks.
- Post-merge ACA main deploy workflow.
- Signed-in browser smoke artifacts for Meridian, SkyHarbor Air, and First Capital.

## Known Gaps

The prior post-deploy crawl for commit `5914f8ee` was still running in authenticated crawl when this hotfix was prepared; this hotfix is driven by direct signed-in smoke evidence instead.
