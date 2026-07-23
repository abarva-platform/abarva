# 2026-07-23 Tower Legacy Source Physical Purge

## Release ID

`2026-07-23-tower-legacy-source-physical-purge`

## Status

`candidate`

## Plain-English Summary

The previous Tower page was already removed from product runtime: `/tower` serves the Command Center and `/tower/legacy` redirects to `/tower`. This release removes the dead legacy source files and old tests that kept the retired page alive in the repository.

## Layer Impact

- `global-control-lane`: Deletes retired Tower presentation code and retargets static guard tests to the active Command Center route and aVa shell.
- `client-data-lane`: No data-plane mutation, schema change, Tower mart rebuild, tenant load, or context promotion.

## Client Applicability

- All clients: No visible product change is intended; all clients already receive the Command Center Tower runtime.
- Specific clients: Meridian, Airline Demo, and FS Demo remain the signed-in proof tenants for Tower.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deletes `src/components/tower/TowerIndexPage.tsx`.
- Deletes `src/components/tower/TowerCommandCenterContract.tsx`.
- Deletes the obsolete `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` suite.
- Retargets surviving Tower guard tests to `src/app/(maestro)/tower/page.tsx` and `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx`.
- Updates active comments, the Tower live-chat sunset guard, and the AI-generated UI catalog to reference the Command Center path.

## QA / Validation

- PASS: Focused Jest guard suite covering Tower route invariants, DB-only surface guard, aVa timeout contract, top-bar tenant display handling, and shell layout guard.
- PASS: Focused ESLint on touched tests, active Tower helper components, and the Command Center action drawer.
- PASS: TypeScript compile with `tsc -p tsconfig.json --noEmit --pretty false`.
- PASS: `git diff --check`.
- PENDING: `npm run release:check -- --base origin/main --head HEAD` after this record update.
- NOT RUN YET: Post-deploy ACA runtime invariant and signed-in `/tower` / `/tower/legacy` proof for Meridian, Airline Demo, and FS Demo. Required after merge/deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image and shifts traffic after health and runtime invariant checks pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned ACA main deploy workflow.
- Approved image digest: Resolved by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR through a new PR and redeploy through ACA main if any deleted source path is unexpectedly needed. No database rollback is required.

## Audit Evidence

- PR for this release.
- Local and GitHub validation output.
- ACA main deploy run after merge.
- ACA runtime invariant output.
- Signed-in browser proof screenshots/results for `/tower` and `/tower/legacy`.

## Known Gaps

Historical docs and older release records may still mention `TowerIndexPage.tsx` as past evidence. Those references are intentionally historical and do not make the old page reachable.
