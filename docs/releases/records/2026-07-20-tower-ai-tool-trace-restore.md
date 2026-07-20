# 2026-07-20-tower-ai-tool-trace-restore — Tower AI Tool Trace Restore

## Release ID

`2026-07-20-tower-ai-tool-trace-restore`

## Status

`candidate`

## Plain-English Summary

Restores the Tower AI Value Realization tool-spend view from the approved reference design. The Tower AI Portfolio tab again shows active AI tools, spend/value proof, claim gates, and a double-click investment trace drawer for Copilot-style tool rows while preserving the governed mart dashboard shell. A follow-up extends the same restored tool trace to the sparse CXO Tower path used by FS Demo and Airline when mart AI rows are incomplete.

## Layer Impact

- Lane: `global-control-lane`.
- Product UI: adds the reference tool-spend table and drill-in drawer to the Tower AI Portfolio surface.
- Governed read model display: loaded mart rows remain authoritative and override Day-1 reference rows when they have the same display name.
- Sparse CXO Tower path: shows the reference tool-spend panel when the mart path has value/readiness rows but missing AI tool detail rows.
- Demo tenant presentation: restores buyer-visible tool-spend detail for FS Demo, Healthcare/Meridian, and Airline/SkyHarbor without changing persistence, ingestion, or Tower value calculations.

## Client Applicability

- All clients: Tower AI Portfolio can display loaded mart AI-portfolio rows in the restored table.
- Specific clients: FS Demo, Healthcare Demo/Meridian, and Airline Demo/SkyHarbor receive reference Day-1 tool trace rows when loaded mart rows are thin.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Tower mart view path; no new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Adds AI tool trace row contract.
  - Adds tenant-aware reference tool trace rows for Healthcare/Meridian, FS Demo, and Airline/SkyHarbor.
  - Adds the Active AI Tools table and double-click/Inspect investment trace drawer.
  - Threads tenant key/name into the sparse CXO Tower AI Portfolio path so reference rows render there too.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
  - Adds regression coverage for Meridian Copilot drill-in.
  - Adds regression coverage that FS Demo and Airline render tenant-specific restored tool rows.
  - Adds regression coverage for Airline's governed CXO fallback path.

## QA / Validation

- `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand --testNamePattern "Tower command mart|reference tool-spend"`: passed.
- `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand --testNamePattern "governed Portfolio Value Pack|Tower command mart|reference tool-spend"`: passed after sparse-path follow-up.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: 0 errors; pre-existing warnings remain in the large Tower component.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: passed.
- `npm run release:check`: passed.

## Rollout Plan

Merge through a PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA. After deployment, verify `app.abarva.ai` with signed-in Tower checks for FS Demo, Healthcare/Meridian, and Airline/SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after ACA deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower AI Portfolio table and double-click trace drawer for FS Demo, Healthcare/Meridian, and Airline/SkyHarbor.

## Rollback Plan

Revert the PR and redeploy through the ACA main lane. No schema or data migration rollback is required.

## Audit Evidence

- PR URL: pending.
- Focused Jest output: Tower command mart and reference tool-spend tests passed.
- Signed-in screenshots: pending after deploy.
- ACA revision/image digest: pending after deploy.

## Known Gaps

Live production proof is pending until the PR is merged and deployed.
