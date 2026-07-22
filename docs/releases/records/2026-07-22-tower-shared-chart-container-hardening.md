# 2026-07-22-tower-shared-chart-container-hardening — Tower Shared Chart Container Hardening

## Release ID

`2026-07-22-tower-shared-chart-container-hardening`

## Status

`candidate`

## Plain-English Summary

Tower's shared chart components now keep a minimum renderable size when a chart is mounted inside a tab or responsive panel. This prevents Recharts from reporting invalid width/height warnings during signed-in Tower navigation while preserving the existing mart-backed numbers and visuals.

## Layer Impact

- `global-control-lane` / UI rendering layer: hardens shared Tower Recharts containers used by Tower executive exhibits.
- `client-data-lane`: no Azure/Postgres write, no mart projection change, no schema change, and no source-data change.

## Client Applicability

- All clients: Tower chart container behavior is shared.
- Specific clients: Meridian / Healthcare Demo is the proof tenant for the refreshed CXO Tower flow.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/charts/TowerCxoCharts.tsx`
  - Adds minimum Recharts container dimensions to the shared Tower CXO chart components that can mount inside responsive or tabbed panels.
- `docs/releases/records/2026-07-22-tower-shared-chart-container-hardening.md`
  - Adds this release record.

## QA / Validation

- `npm test -- src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
  - Passed: 2 suites, 24 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
  - Passed.
- `npm run release:check`
  - Passed after this release record was corrected to the current template.
- `git diff --check`
  - Passed.

## Rollout Plan

Merge to `main` through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow will build and deploy the digest-pinned image. After deploy, run the ACA runtime invariant and signed-in Meridian Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured by ACA main deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian / Healthcare Demo Tower.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- Pre-fix signed-in browser proof of the remaining chart warning:
  - `/tmp/tower-cxo-post5310-browser-proof-20260722/proof.json`
  - `/tmp/tower-cxo-post5310-browser-proof-20260722/relevant-warnings.log`
- Post-deploy proof target:
  - `/tmp/tower-cxo-post5311-browser-proof-20260722`

## Known Gaps

- This PR does not load live Copilot, ServiceNow, Workday/SAP, GitHub/Codex, or DORA telemetry. It only hardens chart rendering.
- Tower's broader data story remains governed by the Tower mart and source-backed V3/SA08 data flow; this PR does not change those facts.
