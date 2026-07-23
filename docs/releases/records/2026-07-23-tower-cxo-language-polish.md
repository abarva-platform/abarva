# 2026-07-23 Tower CXO Language Polish

## Release ID

`2026-07-23-tower-cxo-language-polish`

## Status

`candidate`

## Plain-English Summary

Removes data-engineering vocabulary from the new Tower Command Center surface. The Evidence tab still preserves the inspection trail, but the executive read no longer asks a CXO to parse phrases like raw lineage, Tower mart, or outcome rows.

## Layer Impact

- `global-control-lane`: Updates Tower presentation copy only. No data-plane writes, no schema changes, and no mart projection changes are included.
- `client-data-lane`: No client data changes. The same governed Tower data continues to drive the page.

## Client Applicability

- All clients: Tower users who can access the Command Center surface.
- Specific clients: Healthcare Demo / Meridian is the signed-in proof tenant for this release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerCommandCenterContract.tsx`
  - Replaces `Tower mart` user-facing copy with `governed Tower data`.
  - Replaces `Raw lineage` with `Detailed trace`.
  - Replaces `outcome rows` with `outcome evidence`.

## QA / Validation

- `npx eslint src/components/tower/TowerCommandCenterContract.tsx`
- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`
  - Passed: 17/17 Tower tests.
  - Existing duplicate manual mock warnings were observed and are unrelated to this change.
- `rg -n "outcome rows|Raw lineage|from Tower mart|current Tower mart|available in the mart|categorized in the mart|\\bnodes\\b|\\bedges\\b" src/components/tower/TowerCommandCenterContract.tsx`
  - Passed: no matches.
- `git diff --check`
  - Passed.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the merged SHA to `app.abarva.ai`. After deployment, run signed-in Tower browser proof for the Healthcare Demo tenant and capture Command Center, AI Portfolio, and Evidence screenshots.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. The rollback only restores previous copy; it does not alter Tower data or mart projection state.

## Audit Evidence

- PR URL: to be attached after PR creation.
- Signed-in proof: `/Users/anand/Projects/nexus/proof/tower-command-contract-fidelity-20260723/` after deployment.

## Known Gaps

This release does not redesign the AI Portfolio visualization or add new telemetry feeds. It only removes technical language from the visible Tower Command Center surface.
