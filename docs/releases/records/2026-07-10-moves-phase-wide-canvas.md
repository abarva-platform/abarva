# 2026-07-10-moves-phase-wide-canvas — Moves phase wide canvas

## Release ID

`2026-07-10-moves-phase-wide-canvas`

## Status

`candidate`

## Plain-English Summary

This is a focused UI/UX polish pass for the standalone Moves phase workspace. After live proof, the page was functionally correct but left too much unused space on wide screens. This release widens the main phase workspace so the page uses more of the available canvas while keeping long executive text readable.

## Layer Impact

- `global-control-lane`: visual-only desktop layout polish in the shared Moves phase workspace.
- No `client-data-lane` impact: no schema, data load, read-model mutation, or workflow state change.

## Client Applicability

- All clients: yes, for Moves phase pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: widens the desktop workspace shell, gives the templates/sessions grid more horizontal room, and preserves the mobile single-column fallback.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — focused component regression remains green. Jest printed pre-existing duplicate manual mock warnings, but no failures.
- Pass: `npm run release:check`.
- Live proof: pending merge/deploy. Required proof is the deployed Moves phase page screenshot showing the wider canvas and no how-to overlap.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, verify ACA runtime invariant, then rerun the signed-in Moves phase screenshot proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be confirmed post-deploy.
- ACA runtime invariant: to be verified post-deploy.
- Worker image invariant: unaffected.
- Feature/env flag update path: no env or flag update required.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release and redeploy. Because this is visual-only CSS polish, rollback restores the previous standalone workspace width without data impact.

## Audit Evidence

- User-supplied screenshot showed excessive unused canvas on the live Moves phase page.
- Focused local validation commands listed above.

## Known Gaps

- Live signed-in proof is pending deployment.
