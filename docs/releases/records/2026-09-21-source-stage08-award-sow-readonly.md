# 2026-09-21-source-stage08-award-sow-readonly — Source Stage 08 Read-Only Handoff Planner

## Release ID

`2026-09-21-source-stage08-award-sow-readonly`

## Status

`candidate`

## Plain-English Summary

Source Stage 08 now draws a sharper line between a contract package that is ready for signature and evidence that proves an agreement or SOW was actually executed. The Stage 08 handoff panel also shows a read-only Contract 360 publication planner. The planner explains what evidence is accepted, what writes stay blocked, and what review steps are still required before a canonical contract or Contract 360 row can be created by an approved writer.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products/Source: Updates the Stage 08 readiness projection and rendered panel only.
- Layer 3 Canonical model: No canonical contract rows, Contract 360 rows, migrations, or schema changes are created by this release.
- Layers 1-2: No client intake, source adapter, tenant file, or data-plane behavior changes.

## Client Applicability

- All clients: Yes, wherever the Source Stage 08 handoff panel is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route and workspace flags only; this release adds no new flag.

## Changes Included

- `src/lib/source/award-sow-handoff-readiness.ts`
- `src/lib/source/award-sow-handoff-readiness-types.ts`
- `src/components/source/SourceAwardSowHandoffReadinessPanel.tsx`
- `src/lib/source/__tests__/award-sow-handoff-readiness.test.ts`
- `src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/award-sow-handoff-readiness.test.ts --runInBand`
- PASS: `npx jest src/lib/source/__tests__/award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts --runInBand`
- PASS: mutation probe removing `change_control_provenance` from the required formation components made `award-sow-handoff-readiness.test.ts` fail, then passed again after restoration.
- PASS: `npx eslint src/lib/source/award-sow-handoff-readiness.ts src/lib/source/award-sow-handoff-readiness-types.ts src/lib/source/__tests__/award-sow-handoff-readiness.test.ts src/components/source/SourceAwardSowHandoffReadinessPanel.tsx src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck`

## Rollout Plan

Squash-merge through the protected PR lane. The repo-owned ACA main deploy workflow may deploy the merged Source UI change. No migration, data-build job, tenant write, feature flag update, supplier communication, or manual canonical publication is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Record from the repo-owned deploy run after merge.
- ACA runtime invariant: Required after deployment before claiming deployed/live.
- Worker image invariant: Required after deployment before claiming deployed/live.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the Stage 08 panel is live-proven in the signed-in product.

## Rollback Plan

Revert the PR. This returns Stage 08 readiness to the prior package/executed-evidence checks and removes the read-only publication planner from the panel. No data rollback is required because no data-plane or canonical writes are performed.

## Audit Evidence

- Pull request and CI checks.
- Focused Jest output for the Stage 08 readiness builder and panel.
- Scoped ESLint output.
- Typecheck output.
- Release-check output.
- Repo-owned ACA deployment run and runtime invariant proof if deployed.
- Signed-in Stage 08 browser proof after deployment before any live-proven claim.

## Known Gaps

- The planner does not create or update canonical contract records, Contract 360 projections, signatures, awards, binding terms, or supplier notifications.
- Legal authority, approved canonical writer selection, and publication policy remain human decisions outside this read-only planner.
- Signed-in browser proof is not captured by this local code change and remains required after deployment.
