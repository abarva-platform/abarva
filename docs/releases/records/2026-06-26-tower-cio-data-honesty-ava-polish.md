# 2026-06-26-tower-cio-data-honesty-ava-polish — Tower CIO Data Honesty And aVa Polish

## Release ID

`2026-06-26-tower-cio-data-honesty-ava-polish`

## Status

`candidate`

## Plain-English Summary

Tower now treats missing or unproven CIO metrics as gaps or review-required data instead of presenting `$0` or `0.00x` as business facts. The Tower CIO dashboard also suppresses raw initiative identifiers from executive-facing copy, and the shared aVa mark now uses the approved packaged aVa asset.

## Layer Impact

- `global-control-lane`: shared aVa mark changes every surface that imports `AvaAskMark`.
- `global-control-lane`: Tower view-model and dashboard copy are global runtime behavior for all tenants.
- `client-data-lane`: no schema or data migration; the change only changes how existing tenant read-model values are interpreted and displayed.

## Client Applicability

- All clients: yes, Tower and shared aVa mark behavior applies globally.
- Specific clients: Lakeshore and SkyHarbor were the live proof targets because their Tower rows exposed the spend-honesty gap.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Shared aVa mark now renders the approved packaged SVG under `public/brand/ava/`.
- Tower band metrics return ROI as a gap when measured-value fields are absent.
- Tower renewal and spend-at-risk tooltips use business labels instead of initiative codes.
- Tower CIO dashboard adds spend quality states: empty, missing values, unmeasured, usable.
- Tower CIO cards display `gap` or `review` for unproven portfolio, ROI, vendor, and pressure values.
- Tower prompt grounding removes raw initiative IDs from the text passed to the aVa answer path.

## QA / Validation

- `npx jest src/__tests__/integration/tower/tower-t5-band-metrics.test.ts src/__tests__/integration/tower/today-resolution.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/ava-chat/__tests__/AvaChatShell.test.tsx src/__tests__/integration/tower/tower-t7-atlas-observations.test.ts src/__tests__/integration/tower/tower-atlas-reasoning-trace.test.ts --runInBand` passed: 7 suites, 59 tests.
- Targeted ESLint on the changed Tower/aVa files passed with 0 errors. Existing unused-symbol warnings remain in the large Tower page.
- `npm run release:check` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` reached the repo's pre-existing missing dependency declarations: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`. No Tower-specific TypeScript errors were reported before those dependency errors.
- Deploy proof and signed-in browser proof will be appended before release.

## Rollout Plan

Merge to main, build a digest-pinned Azure Container Apps image from the merge SHA, update `ca-abarva-web-lab-eastus`, shift 100% traffic to the healthy revision, then run signed-in Tower browser proof for Lakeshore and SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps release path only.
- Shared runtime mutators: no local or branch runtime mutation is approved.
- Approved image digest: to be filled after ACR build.
- ACA runtime invariant: template image, 100% traffic revision image, and approved digest must match.
- Worker image invariant: no worker image change in this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower Lakeshore and SkyHarbor.

## Rollback Plan

Reassign ACA traffic to the prior known-good main revision or redeploy the prior approved digest. No database rollback is required because this release has no migration.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4021
- CI run: to be filled.
- ACA revision/digest: to be filled.
- Signed-in screenshots: to be filled.

## Known Gaps

Legacy internal module/type names still include `Atlas` in places that are not user-facing. This release removes visible Tower branding and CIO-copy leakage without doing a broad runtime type rename.
