# 2026-08-10-source-selection-readiness — Source Selection Readiness

## Release ID

`2026-08-10-source-selection-readiness`

## Status

`candidate`

## Plain-English Summary

This release completes the deterministic Source vendor-selection readiness slice. Selection and executive-decision workspaces now show whether the event is ready for selection review, what is blocked, which vendors remain viable, what evidence or approvals are missing, and the next action. The panel is explicitly advisory and does not automate final vendor selection or award approval.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source renders an additional readiness projection in the active event workspace.
- Layer 3 Canonical Model: No schema, tenant data, or canonical-object mutation.
- AI/Narrative: No model calls are added; readiness is computed from existing deterministic Source signals.

## Client Applicability

- All clients: Applies to Source event workspaces that use the shared sourcing-event canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source vendor-selection readiness panel language is human-readable and avoids raw enum labels.
- Selection and executive-decision workspaces render the readiness panel above the existing decision canvas.
- Source active workspace imports were narrowed away from the broad Source barrel for cleaner test/runtime boundaries.
- Targeted model, panel, and workspace smoke tests were added.
- Source commercial backlog items SRC39, SRC40, and SRC41 were marked complete.
- The Source contract-optimization audit prompt now includes an autonomous improvement section for safe, demo-impacting fixes.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/vendor-selection-readiness.test.ts src/components/source/__tests__/SourceVendorSelectionReadinessPanel.test.tsx src/components/source/__tests__/SourceActiveStageWorkspace.selectionReadiness.test.tsx --runInBand`
- PASS: `npx eslint src/lib/source/vendor-selection-readiness.ts src/components/source/SourceVendorSelectionReadinessPanel.tsx src/components/source/SourceActiveStageWorkspace.tsx src/lib/source/__tests__/vendor-selection-readiness.test.ts src/components/source/__tests__/SourceVendorSelectionReadinessPanel.test.tsx src/components/source/__tests__/SourceActiveStageWorkspace.selectionReadiness.test.tsx`
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- PENDING: Signed-in Source live smoke after ACA deployment.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deployment workflow builds and deploys the image. No data migration, feature flag, or manual operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA workflow completes.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source event workspace after deployment.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to redeploy `main`. No data rollback is required because the change is UI/service projection only.

## Audit Evidence

To be filled after merge/deploy:

- PR URL
- Merge commit
- ACA deploy workflow run
- Live signed-in Source smoke proof

## Known Gaps

This release does not implement event archival, pricing drilldowns, BAFO scenario comparison, transition readiness, or contract-optimization story exports. Those remain separate Source backlog slices.
