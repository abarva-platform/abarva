# 2026-07-23 Tower Vendor Visibility Fix

## Release ID

`2026-07-23-tower-vendor-visibility-fix`

## Status

`candidate`

## Plain-English Summary

Tower Command Center now surfaces source-backed AI vendor attribution in the default AI Portfolio overview and Spend Attribution view. The prior data-plane repair loaded vendor and system attribution, but the executive view still hid it unless a user opened a drawer or switched to the full table.

## Layer Impact

- Release lane: `global-control-lane`
- Presentation layer: adds a compact top-vendor attribution strip under the AI spend lens.
- Runtime read-model layer: no schema or loader change. The strip reads existing `mart_ai_portfolio` fields already mapped into the Tower view model.

## Client Applicability

- All clients: Applies wherever Tower Command Center v2 is enabled.
- Specific clients: Meridian, Airline Demo, and FS Demo are the immediate proof targets.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Tower Command Center gating remains unchanged.

## Changes Included

- `src/components/tower/command-center/views/AiPortfolioView.tsx`
- `src/components/tower/command-center/TowerCommandCenter.module.css`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS: targeted ESLint for the changed Tower files.
- PASS: `git diff --check`
- PASS: targeted TypeScript compile.
- PENDING: `npm run release:check`
- PENDING: signed-in browser proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned ACA main workflow. No manual Azure traffic mutation and no data reload are required for this presentation-only fix.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: To be captured after ACA main deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: No flag/env update in this change.
- Live signed-in proof required: Yes, for Meridian, Airline Demo, and FS Demo Tower AI Portfolio.

## Rollback Plan

Revert this PR or disable Tower Command Center v2 through the existing feature gate. No data rollback is required.

## Audit Evidence

- PR URL, merge commit, ACA deploy run, runtime invariant output, and signed-in browser screenshots should be attached after release.

## Known Gaps

This does not create new vendor economics or contract-level attribution. It only renders attribution already present in the governed Tower AI portfolio mart.
