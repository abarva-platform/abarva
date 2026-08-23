# 2026-08-23-moves-ava-launcher-icon-only — Moves aVa Launcher Icon-Only Correction

## Release ID

`2026-08-23-moves-ava-launcher-icon-only`

## Status

`candidate`

## Plain-English Summary

Corrects the compact Moves `Ask aVa` launcher so the visual label is actually hidden on narrower desktop viewports instead of wrapping beside the icon. The accessible label remains available to assistive technology.

## Layer Impact

- Product layer: Moves UI layout polish only.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, tenant-data, or data-plane writes.

## Client Applicability

- All clients: Applies to the Moves phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Increases selector specificity for the compact launcher rule so it overrides the generic Moves button font rule.
- Extends the launcher safe-area regression expectation to pin the icon-only styling.

## QA / Validation

Status: `pass`.

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand -t "reserves bottom safe area"`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Determined by the repo-owned deploy workflow if deployed.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, visual confirmation on a signed-in Moves phase page after deploy.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6685
- Prior signed-in proof showing the compact launcher width applied while text still wrapped: `/tmp/nexus-moves-6683-compact-proof.jpg`.

## Known Gaps

- This is a focused launcher presentation correction. It does not alter phase gates, approvals, evidence handling, persistence, aVa responses, or deliverable generation.
